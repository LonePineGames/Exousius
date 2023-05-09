const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const sqlite3 = require('sqlite3').verbose();
const sqlite = require('sqlite');
const dbFile = './world.db';
const fs = require('fs');
const RomanNumerals = require('roman-numerals');
const { promptBot, punchUpNarration, describePlace, createPicture, listMobs, promptCharacterBuilder } = require('./prompt');
const { listNames } = require('./names');

let gameRate = 10000;
let socketTable = [];
const maxShards = 100;

app.use(express.static('public'));

async function initializeDatabase() {
  const db = await sqlite.open({
    filename: dbFile,
    driver: sqlite3.Database,
  });

  console.log('Connected to the SQLite database.');

  async function makeTable(tableName, columns) {
    try {
      await db.run(`CREATE TABLE IF NOT EXISTS ${tableName} (${columns});`);
      console.log('Table created (or already exists.)');

      return db;
    } catch (err) {
      console.error(err.message);
    }
  }

  await makeTable('characters', `
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL,
      name TEXT NOT NULL,
      status INTEGER NOT NULL,
      script TEXT NOT NULL,
      description TEXT NOT NULL,
      title TEXT NOT NULL,
      summoner TEXT NOT NULL,
      memory TEXT,
      room TEXT NOT NULL,
      hp INTEGER NOT NULL,
      shards INTEGER NOT NULL`);

  await makeTable('messages', `
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room TEXT NOT NULL,
      character TEXT NOT NULL,
      text TEXT NOT NULL,
      timestamp TEXT NOT NULL`);

  await makeTable('seen_messages', `
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id INTEGER NOT NULL,
      character_name TEXT NOT NULL`);

  await makeTable('rooms', `
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      image_url TEXT,
      shards INTEGER NOT NULL,
      mobs TEXT NOT NULL`);

  await makeTable('scripts', `
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      character TEXT NOT NULL,
      name TEXT NOT NULL,
      script TEXT NOT NULL,
      description TEXT NOT NULL,
      title TEXT NOT NULL`);

  let originExists = await db.get(
    `SELECT name FROM rooms WHERE name = 'origin';`
  ).then((row) => row !== undefined);
  if (!originExists) {
    await db.run(`INSERT INTO rooms (name, description, image_url, shards, mobs) VALUES ('origin', 'The origin void. Infinite, empty black space.', '', 0, '');`);

    /*
    await db.run(`INSERT INTO rooms (name, description, shards) VALUES ('forest', 'A beautiful, enchanted forest.', 0);`);

    await db.run(`INSERT INTO rooms (name, description, shards) VALUES ('caves', 'Dark, spooky caves.', 0);`);
    */
  }

  return db;
}

async function punchUp(db, message) {
  let inRoom = await db.all(
    'SELECT * FROM characters WHERE room = ? and hp > 0;',
    [message.room]
  );

  if (inRoom.length === 0) {
    return message.text;
  }

  // determine if there are any users in the room
  if (!inRoom.some((character) => character.role === 'user')) {
    return message.text;
  }

  let room = await db.get(
    `SELECT * FROM rooms WHERE name = ?;`,
    [message.room]
  );

  let history = await db.all(
    'SELECT * FROM messages WHERE room = ? ORDER BY timestamp DESC LIMIT 10;',
    [message.room]
  );

  let result = await punchUpNarration(message.text, history, room, inRoom);
  if (result && result !== '') {
    return result;
  } else {
    return message.text;
  }
}

async function send(db, messageData) {
  const message = {
    timestamp: new Date().toISOString(),
    ...messageData,
  };

  console.log(`${message.character} (${message.room}): ${message.text}`);

  if (message.character === 'Narrator') {
    message.text = await punchUp(db, message);
  }

  message.id = await db.run(
    `INSERT INTO messages (room, character, text, timestamp) VALUES (?, ?, ?, ?);`,
    [message.room, message.character, message.text, message.timestamp]
  ).then((result) => result.lastID);

  let charactersInRoom = await db.all(
    `SELECT name FROM characters WHERE room = ? and hp > 0;`,
    [message.room]
  );

  charactersInRoom.forEach(async (character) => {
    await db.run(
      `INSERT INTO seen_messages (message_id, character_name) VALUES (?, ?);`,
      [message.id, character.name]
    );
  });

  io.to(message.room).emit('message', message);

  if (message.character !== 'Narrator') {
    await processActions(db, message);
  }
}

async function processActions(db, message) {
  const actions = parseActions(message.text);

  if (actions.length === 0) {
    return;
  }

  let character = await db.get(
    `SELECT * FROM characters WHERE name = ?;`,
    [message.character]
  );

  for (const action of actions) {
    await executeAction(db, character, action);
  }
}

async function executeAction(db, character, action) {
  const actionHandler = actionHandlers[action.name];
  if (actionHandler) {
    await actionHandler(db, character, action);
  } else {
    let actionText = action.text === '' ? `%${action.name}%` :
      `%${action.name} ${action.text}%`;
    await send(db, {
      room: character.room,
      character: 'Narrator',
      text: `${character.name} did: ${actionText}`,
    });
  }
}

function parseActions(text) {
  const segments = text.split('%');
  // return every other segment, starting with the second
  return segments.filter((_, i) => i % 2 === 1).map(parseAction);
}

function parseAction(ntext) {
  let firstSpace = ntext.indexOf(' ');
  if (firstSpace === -1) {
    firstSpace = ntext.length;
  }
  return {
    name: ntext.substring(0, firstSpace),
    text: ntext.substring(firstSpace + 1),
  };
}

async function spendShard(db, character) {
  const shards = await db.get(
    `SELECT shards FROM characters WHERE name = ?;`,
    [character.name]
  ).then((row) => row.shards);

  if (shards === 0) {
    return false;
  }

  const newShards = shards - 1;

  await db.run(
    `UPDATE characters SET shards = ? WHERE name = ?;`,
    [newShards, character.name]
  );

  socketTable.filter((socket) => socket.character === character.name).forEach((socket) => {
    socket.emit('shards', newShards);
  });

  return true;
}

let actionHandlers = {
  async go(db, character, action) {
    const room = action.text;
    if (room === '') {
      return;
    }

    const previousRoom = character.room;
    if (room === previousRoom) {
      await send(db, {
        room: character.room,
        character: 'Narrator',
        text: `But ${character.name} was already in the ${room}.`,
      });
      return;
    }

    let roomData = await db.get(
      `SELECT * FROM rooms WHERE name = ?;`,
      [room]
    );

    if (!roomData) {
      await send(db, {
        room: character.room,
        character: 'Narrator',
        text: `But ${character.name} couldn't go to the ${room} because it didn't exist.`,
      });
      return;
    }

    await db.run(
      `UPDATE characters SET room = ? WHERE name = ?;`,
      [room, character.name]
    );
    character.room = room;

    let playerInRoom = false;
    socketTable.filter((socket) => socket.character === character.name).forEach(async (socket) => {
      socket.leave(previousRoom);
      socket.join(room);
      socket.emit('room', room);
      playerInRoom = true;
    });

    await send(db, {
      room: previousRoom,
      character: 'Narrator',
      text: `${character.name} left to go to the ${room}.`,
    });

    if (playerInRoom) {
      reportRoom(db, character, room);
    }

    await send(db, {
      room: room,
      character: 'Narrator',
      text: `${character.name} traveled to the ${room}.`,
    });
  },

  async create(db, character, action) {
    console.log('create', action.text, character.name);
    const roomName = action.text;
    if (roomName === '') return;

    if (roomName === '...') {
      await send(db, {
        room: character.room,
        character: 'Narrator',
        text: `But first ${character.name} needed to determine what location to create. Perhaps %create ancient forest% or %create secret tavern%?`,
      });
      return;
    }

    let roomExists = await db.get(
      `SELECT name FROM rooms WHERE name = ?;`,
      [roomName]
    ).then((row) => row !== undefined);

    if (roomExists) {
      await send(db, {
        room: character.room,
        character: 'Narrator',
        text: `But ${character.name} couldn't create the ${roomName} because it already existed.`,
      });
      return;
    }

    if (!await spendShard(db, character)) {
      await send(db, {
        room: character.room,
        character: 'Narrator',
        text: `But ${character.name} couldn't create the ${roomName} because they don't have any shards.`,
      });
      return;
    }

    let totalShards = await getTotalShards(db);
    let initShards = Math.max(0, Math.min(maxShards - totalShards, 3));
    console.log("initShards", initShards);

    let id = await db.run(
      `INSERT INTO rooms (name, description, image_url, shards, mobs) VALUES (?, ?, ?, ?, ?);`,
      [roomName, '', '', initShards, '']
    ).then((result) => result.lastID);
    let room = {
      name: roomName,
      description: '',
      image_url: '',
      shards: initShards,
      mobs: '',
    };

    await send(db, {
      room: character.room,
      character: 'Narrator',
      text: `${character.name} used a shard and created the ${roomName}.`,
    });

    let history = await db.all(
      `SELECT * FROM messages WHERE room = ? ORDER BY id DESC LIMIT 10;`,
      [character.room]
    );
    room.description = await describePlace(character, history, roomName);

    await db.run(
      `UPDATE rooms SET description = ? WHERE id = ?;`,
      [room.description, id]
    );

    await send(db, {
      room: character.room,
      character: character.name,
      text: `%go ${roomName}%`,
    });

    room.mobs = await listMobs(room);
    await db.run(
      `UPDATE rooms SET mobs = ? WHERE id = ?;`,
      [room.mobs, id]
    );
    room.image_url = await createPicture(room.description);

    await db.run(
      `UPDATE rooms SET image_url = ? WHERE id = ?;`,
      [room.image_url, id]
    );

    console.log('picture', room.image_url);

    socketTable.forEach(async (socket) => {
      let characterRoom = await db.get(
        `SELECT room FROM characters WHERE name = ?;`,
        [socket.character]
      ).then((row) => row.room);

      if (characterRoom === roomName) {
        socket.emit('background-image', room.image_url);
      }
    });

    setTimeout(async () => {
      await spawnMobInRoom(db, room);
    }, 5000);
  },

  async search(db, character, action) {
    let room = character.room;
    let shards = await db.get(
      `SELECT shards FROM rooms WHERE name = ?;`,
      [room]
    ).then((row) => row.shards);

    if (shards > 0) {
      await db.run(
        `UPDATE characters SET shards = shards + 1 WHERE name = ?;`,
        [character.name]
      );

      await db.run(
        `UPDATE rooms SET shards = ? WHERE name = ?;`,
        [shards-1, room]
      );

      await send(db, {
        room: character.room,
        character: 'Narrator',
        text: `${character.name} searched the ${character.room} and found a shard.`,
      });

      let characterShards = await db.get(
        `SELECT shards FROM characters WHERE name = ?;`,
        [character.name]
      ).then((row) => row.shards);

      socketTable.filter((socket) => socket.character === character.name).forEach((socket) => {
        socket.emit('shards', characterShards);
      });

    } else {
      await send(db, {
        room: character.room,
        character: 'Narrator',
        text: `${character.name} searched the ${character.room} for shards, but found nothing.`,
      });
    }
  },

  async destroy(db, character, action) {
    if (character.room === 'origin') {
      await send(db, {
        room: character.room,
        character: 'Narrator',
        text: `But no one can destroy the origin, not even ${character.name}.`,
      });
      return;
    }

    if (!await spendShard(db, character)) {
      await send(db, {
        room: character.room,
        character: 'Narrator',
        text: `But ${character.name} couldn't destroy the ${character.room} because they don't have any shards.`,
      });
      return;
    }

    await send(db, {
      room: character.room,
      character: 'Narrator',
      text: `${character.name} used a shard and destroyed the ${character.room}.`,
    });

    const charactersInRoom = await db.all(
      `SELECT * FROM characters WHERE room = ? and hp > 0;`,
      [character.room]
    );

    console.log(charactersInRoom);

    charactersInRoom.forEach(async (characterInRoom) => {
      await executeAction(db, character, { name: 'go', text: 'origin' });
    });

    await db.run(
      `DELETE FROM rooms WHERE name = ?;`,
      [character.room]
    );
  },

  async summon(db, character, action) {
    const summonName = action.text;

    const script = await db.get(
      `SELECT * FROM scripts WHERE name = ?;`,
      [summonName]
    );

    if (script === undefined) {
      await send(db, {
        room: character.room,
        character: 'Narrator',
        text: `But ${character.name} couldn't summon ${summonName} because there isn't a script named ${summonName}.`,
      });
      return;
    }

    if (!await spendShard(db, character)) {
      await send(db, {
        room: character.room,
        character: 'Narrator',
        text: `But ${character.name} couldn't summon ${summonName} because they don't have any shards.`,
      });
      return;
    }

    let summonInstance = summonName;
    for (let num = 1;; num++) {
      let romanNumeral = RomanNumerals.toRoman(num);
      summonInstance = `${summonName}-${romanNumeral}`;
      let summonExists = await db.get(
        `SELECT name FROM characters WHERE name = ?;`,
        [summonInstance]
      ).then((row) => row !== undefined);

      if (!summonExists) {
        break;
      }
    }

    await db.run(
      `INSERT INTO characters (role, name, room, status, script, description, title, summoner, hp, shards) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      ['bot', summonInstance, character.room, 1, script.script, script.description, script.title, character.name, 10, 0]
    );

    let recentMessages = await db.all(
      `SELECT * FROM messages WHERE room = ? ORDER BY id DESC LIMIT 10;`,
      [character.room]
    );

    recentMessages.forEach(async (message) => {
      await db.run(
        `INSERT INTO seen_messages (message_id, character_name) VALUES (?, ?);`,
        [message.id, summonInstance]
      );
    });

    await send(db, {
      room: character.room,
      character: 'Narrator',
      text: `${character.name} used a shard and summoned ${summonInstance}.`,
    });
  },

  async strike(db, character, action) {
    let targetName = action.text;
    let potentialTargets = [];
    if (targetName === '') {
      if (character.role === 'mob') {
        potentialTargets = await db.all(
          `SELECT * FROM characters WHERE room = ? and role != 'mob';`,
          [character.room]
        );
      } else {
        potentialTargets = await db.all(
          `SELECT * FROM characters WHERE room = ? and role = 'mob';`,
          [character.room]
        );
      }

    } else {
      potentialTargets = await db.all(
        `SELECT * FROM characters WHERE name = ?;`,
        [targetName]
      );
    }

    if (potentialTargets.length === 0) {
      await send(db, {
        room: character.room,
        character: 'Narrator',
        text: `But ${character.name} couldn't strike ${targetName} because ${targetName} did't exist`,
      });
      return;
    }

    potentialTargets = potentialTargets.filter((target) => target.hp > 0);

    if (potentialTargets.length === 0) {
      await send(db, {
        room: character.room,
        character: 'Narrator',
        text: `But ${character.name} couldn't strike ${targetName} because ${targetName} was already dead.`,
      });
      return;
    }

    potentialTargets = potentialTargets.filter((target) => target.room === character.room);

    if (potentialTargets.length === 0) {
      await send(db, {
        room: character.room,
        character: 'Narrator',
        text: `But ${character.name} couldn't strike ${targetName} because ${targetName} wasn't in the ${character.room}`,
      });
      return;
    }

    if (Math.random() < 0.5) {
      await send(db, {
        room: character.room,
        character: 'Narrator',
        text: `${character.name} tried to strike ${targetName} but missed.`,
      });
      return;
    }

    let target = potentialTargets[Math.floor(Math.random() * potentialTargets.length)];
    let damage = 1;
    if (character.shards > 0) {
      let bonus = Math.floor((1 + character.shards/5) * Math.random());
      damage += bonus;
    }
    console.log(character, target, damage);
    let sacrifice = 0;
    target.hp -= damage;

    if (target.hp <= 0) {
      // Sacrifice shards to revive
      sacrifice = Math.min(target.shards, -target.hp+1);
      target.hp += sacrifice;
      target.shards -= sacrifice;

      if (target.hp < 0) {
        damage += target.hp;
        target.hp = 0;
      }
    }

    let message = `${character.name} struck ${target.name} for ${damage} damage. ${target.name} now has ${target.hp} HP.`;
    if (sacrifice > 0) {
      const inVain = target.hp <= 0 ? ', but it was not enough' : '';
      message += ` ${target.name} sacrificed ${sacrifice} shards to stay alive${inVain}.`;
    }

    await db.run(
      `UPDATE characters SET hp = ?, shards = ? WHERE id = ?;`,
      [target.hp, target.shards, target.id]
    );
    console.log(target, message);
    socketTable.filter((socket) => socket.character === target.name).forEach((socket) => {
      console.log("updating browser");
      socket.emit('hp', target.hp);
      socket.emit('shards', target.shards);
    });

    if (target.hp <= 0) {
      message += ` ${target.name} died.`;

      if (target.role === 'mob') {
        await db.run(
          `DELETE FROM characters WHERE id = ?;`,
          [target.id]
        );
      }
    }

    await send(db, {
      room: character.room,
      character: 'Narrator',
      text: message,
    });
  },

  async heal(db, character, action) {
    let targetName = action.text;

    if (targetName == '') {
      targetName = character.name;
    }
    let target = await db.get(
      `SELECT * FROM characters WHERE name = ?;`,
      [targetName]
    );

    if (target === undefined) {
      await send(db, {
        room: character.room,
        character: 'Narrator',
        text: `But ${character.name} couldn't heal ${targetName} because ${targetName} didn't exist.`,
      });
      return;
    }

    if (target.shards < 0) {
      await send(db, {
        room: character.room,
        character: 'Narrator',
        text: `But ${character.name} couldn't heal ${target.name} because ${target.name} had already returned.`,
      });
      return;
    }

    if (target.room !== character.room) {
      await send(db, {
        room: character.room,
        character: 'Narrator',
        text: `But ${character.name} couldn't heal ${target.name} because ${target.name} wasn't in the ${character.room}`,
      });
      return;
    }

    if (target.hp >= 10) {
      await send(db, {
        room: character.room,
        character: 'Narrator',
        text: `But ${character.name} couldn't heal ${target.name} because ${target.name} was already at full health.`,
      });
      return;
    }

    let heal = Math.ceil(1 + character.shards / 2);
    heal = Math.min(heal, 10 - target.hp);
    console.log(character, target, heal);
    target.hp += heal;

    await db.run(
      `UPDATE characters SET hp = ? WHERE id = ?;`,
      [target.hp, target.id]
    );

    await send(db, {
      room: character.room,
      character: 'Narrator',
      text: `${character.name} healed ${target.name} for ${heal}HP.`,
    });

    socketTable.filter((socket) => socket.character === target.name).forEach((socket) => {
      socket.emit('hp', target.hp);
    });
  },

  async give(db, character, action) {
    let params = action.text.split(' ');
    let number = parseInt(params[params.length - 1]);
    let targetName = params.slice(0, params.length - 1).join(' ');

    if (targetName == '' || targetName == character.name) {
      await send(db, {
        room: character.room,
        character: 'Narrator',
        text: `${character.name} switched ${number} shards between their hands.`,
      });
      return;
    }

    if (character.shards <= 0) {
      await send(db, {
        room: character.room,
        character: 'Narrator',
        text: `But ${character.name} couldn't charge because ${character.name} had no shards.`,
      });
      return;
    }

    let target = await db.get(
      `SELECT * FROM characters WHERE name = ?;`,
      [targetName]
    );

    if (target === undefined) {
      await send(db, {
        room: character.room,
        character: 'Narrator',
        text: `But ${character.name} couldn't give shards to ${targetName} because ${targetName} didn't exist.`,
      });
      return;
    }

    if (target.shards < 0) {
      await send(db, {
        room: character.room,
        character: 'Narrator',
        text: `But ${character.name} couldn't give shards to ${target.name} because ${target.name} had already returned.`,
      });
      return;
    }

    if (target.room !== character.room) {
      await send(db, {
        room: character.room,
        character: 'Narrator',
        text: `But ${character.name} couldn't give shards to ${target.name} because ${target.name} wasn't in the ${character.room}`,
      });
      return;
    }

    await send(db, {
      room: character.room,
      character: 'Narrator',
      text: `${character.name} gave ${target.name} ${number} shards.`,
    });

    target.shards += number;
    character.shards -= number;

    await db.run(
      `UPDATE characters SET shards = ? WHERE id = ?;`,
      [target.shards, target.id]
    );

    await db.run(
      `UPDATE characters SET shards = ? WHERE id = ?;`,
      [character.shards, character.id]
    );

    socketTable.forEach((socket) => {
      if (socket.character === target.name) {
        socket.emit('shards', target.shards);
      } else if (socket.character === character.name) {
        socket.emit('shards', character.shards);
      }
    });
  },

  async scry(db, character, action) {
    if (!spendShard(db, character)) {
      await send(db, {
        room: character.room,
        character: 'Narrator',
        text: `But ${character.name} couldn't scry because ${character.name} had no shards.`,
      });
      return;
    }


    // Add every message in this room to seen_messages, if it's not already there.

    let messages = await db.all(
      `SELECT * FROM messages WHERE room = ?;`,
      [character.room]
    );

    messages.forEach(async (message) => {
      await db.run(
        'INSERT INTO seen_messages (message_id, character_name) SELECT ?, ? WHERE NOT EXISTS (SELECT 1 FROM seen_messages WHERE message_id = ? AND character_name = ?);',
        [message.id, character.name, message.id, character.name]
      );
    });

    await send(db, {
      room: character.room,
      character: 'Narrator',
      text: `${character.name} sacrificed a shard to look into the past. ${character.name} can now see everything that has ever happened in the ${character.room}.`,
    });

    socketTable.filter((socket) => socket.character === character.name).forEach(async (socket) => {
      socket.emit('reset');
      let seenMessages = await recentMessages(db, character, 100);
      socket.emit('previous messages', seenMessages);
    });
  },

  async protect(db, character, action) {
    if (!spendShard(db, character)) {
      await send(db, {
        room: character.room,
        character: 'Narrator',
        text: `But ${character.name} couldn't protect the ${character.room} because ${character.name} had no shards.`,
      });
      return;
    }

    let room = await db.get(
      `SELECT * FROM rooms WHERE name = ?;`,
      [character.room]
    );
    let previousMobs = room.mobs.split(',');

    if (previousMobs.length === 0) {
      await send(db, {
        room: character.room,
        character: 'Narrator',
        text: `But ${character.name} couldn't protect the ${character.room} because there were no creatures to protect it from.`,
      });
    }

    // set mobs to '' for this room
    await db.run(
      `UPDATE rooms SET mobs = '' WHERE name = ?;`,
      [character.room]
    );

    let previousMobsString = listNames(previousMobs);
    await send(db, {
      room: character.room,
      character: 'Narrator',
      text: `${character.name} sacrificed a shard to protect the ${character.room} from ${previousMobsString}.`,
    });
  },

  async disappear(db, character, action) {
    if (character.role !== 'mob') return;

    await send(db, {
      room: character.room,
      character: 'Narrator',
      text: `${character.name} decided to leave our heros alone.`
    });

    console.log('disappear', character);

    await db.run(
      `DELETE FROM characters WHERE id = ?;`,
      [character.id]
    );
  },
};

actionHandlers['return'] = async function(db, character, action) {
  if (character.role === 'user') {
    return;
  }

  let shards = character.shards + 1;

  let summonerRoom = await db.get(
    `SELECT room FROM characters WHERE name = ?;`,
    [character.summoner]
  ).then((row) => row.room);

  await db.run(
    `UPDATE characters SET shards = shards + ? WHERE name = ?;`,
    [shards, character.summoner]
  );

  let summoner = await db.get(
    `SELECT * FROM characters WHERE name = ?;`,
    [character.summoner]
  );

  socketTable.filter((socket) => socket.character === character.summoner).forEach((socket) => {
    socket.emit('shards', summoner.shards);
  });

  let message = {
    room: summonerRoom,
    character: 'Narrator',
    text: `${character.name} returned to ${character.summoner} and restored ${shards} shards. ${character.name} disappeared.`,
  };
  await send(db, message);

  if (character.room !== summonerRoom) {
    message.room = character.room;
    await send(db, message);
  }

  await db.run(
    'UPDATE characters SET hp = 0, shards = -1, room = ? WHERE name = ?;',
    [summonerRoom, character.name]
  );

  /*
  await db.run(
    `DELETE FROM characters WHERE name = ?;`,
    [character.name]
  );
  */
};
// END actionHandlers

const actionSuggestions = [
  async function goSuggestions(db, character) {
    if (character.role === 'mob') return [];
    const rooms = await db.all(
      `SELECT name FROM rooms where name != ?;`,
      [character.room]
    );

    return rooms.map((room) => `%go ${room.name}%`);
  },

  async function summonSuggestions(db, character) {
    if (character.role === 'mob') return [];
    if (character.shards <= 0) {
      return [];
    }

    /*
    if (character.role === 'bot') {
      return [];
    }
    */

    let scripts = await db.all(
      `SELECT name FROM scripts WHERE character = ?;`,
      [character.name]
    );
    let result = scripts.map((script) => `%summon ${script.name}%`);
    return result;
  },

  async function protectScrySuggestions(db, character) {
    if (character.shards <= 0 || character.role !== 'user') {
      return [];
    }

    let room = await db.get(
      `SELECT * FROM rooms WHERE name = ?;`,
      [character.room]
    );

    if (room.mobs.length === 0) {
      return ['%scry%'];
    } else {
      return ['%protect%', '%scry%'];
    }
  },

  async function strikeHealSuggestions(db, character) {
    let validCharacters = await db.all(
      `SELECT * FROM characters WHERE room = ? and hp > 0;`,
      [character.room]
    );

    if (character.role === 'mob') {
      return validCharacters
        .filter((ch) => ch.role != 'mob')
        .map((ch) => `%strike ${ch.name}%`);
    }

    let strike = validCharacters
      .filter((ch) => ch.name !== character.name)
      .map((ch) => `%strike ${ch.name}%`);

    let heal = validCharacters
      .filter((ch) => ch.hp < 10 && ch.shards >= 0 && ch.name !== character.name && ch.role !== 'mob')
      .map((ch) => `%heal ${ch.name}%`);

    let me = validCharacters.find((ch) => ch.name === character.name);
    if (me !== undefined && me.hp < 10) {
      heal.push('%heal%');
    }

    return strike.concat(heal);
  },

  async function giveSuggestions(db, character) {
    if (character.role === 'mob') return [];
    if (character.shards <= 0) {
      return [];
    }

    let shardsToGive = character.role === 'bot' ? character.shards : 1;

    let validCharacters = await db.all(
      `SELECT * FROM characters WHERE room = ? and role != 'mob';`,
      [character.room]
    );

    let give = validCharacters
      .filter((ch) => ch.name !== character.name && ch.hp > 0)
      .map((ch) => `%give ${ch.name} ${shardsToGive}%`);

    return give;
  },

  async function disappearReturnSuggestions(db, character) {
    if (character.role === 'mob') {
      return ['%disappear%'];
    } else if (character.role === 'bot') {
      return ['%return%'];
    } else {
      return [];
    }
  },

  async function searchSuggestions(db, character) {
    if (character.role === 'mob') return [];
    return ['%search%'];
  },
];

async function generateActionSuggestions(db, characterName) {
  let character = await db.get(
    `SELECT * FROM characters WHERE name = ?;`,
    [characterName]
  );

  if (!character) {
    return [];
  }

  let promises = actionSuggestions.map(async (func) => {
    return await func(db, character);
  });

  let suggestions = await Promise.all(promises);
  suggestions = suggestions.reduce((acc, val) => acc.concat(val), []);

  if (character.role === 'mob') {
    console.log(character.name, character.role, suggestions);
  }

  return suggestions;
}

async function reportRoom(db, character) {
  console.log("reportRoom", character);
  let room = await db.get(
    `SELECT * FROM rooms WHERE name = ?;`,
    [character.room]
  );

  let characters = await db.all(
    `SELECT name FROM characters WHERE room = ? and hp > 0;`,
    [character.room]
  ).then((rows) => rows.map((row) => row.name));

  socketTable.filter((socket) => socket.character === character.name).forEach((socket) => {
    socket.emit('message', {
      timestamp: new Date().toISOString(),
      room: character.room,
      character: 'Narrator',
      text: `${room.description} In the ${room.name} was ${listNames(characters)}.`,
    });

    console.log("reportRoom url", room.image_url);
    socket.emit('background-image', room.image_url);
  });
}

async function recentMessages(db, character, number) {
  let seen_messages = await db.all(
    `SELECT * FROM seen_messages WHERE character_name = ? ORDER BY id DESC LIMIT ?`,
    [character.name, number]
  );

  let messages = await db.all(
    `SELECT * FROM messages WHERE id IN (${seen_messages.reverse().map((msg) => msg.message_id).join(',')})`
  );

  return messages;
}

function addSocket(socket, character) {
  socket.character = character;
  // if the socket is not in the table, add it
  if (!socketTable.find((entry) => entry === socket)) {
    socketTable.push(socket);
  }
}

function removeSocket(socket) {
  socketTable = socketTable.filter((entry) => entry !== socket);
}

async function sendRandomRoomImage(socket) {
  // read all jpg files from public/backgrounds/
  let files = await fs.promises.readdir('public/backgrounds/');
  let jpgFiles = files.filter((file) => file.endsWith('.jpg'));

  // pick a random file
  let randomFile = jpgFiles[Math.floor(Math.random() * jpgFiles.length)];

  let path = `/backgrounds/${randomFile}`;

  console.log(path);

  // send the file to the socket
  socket.emit('background-image', path);
}

async function characterBuilder(socket, cbHistory, msg) {
  if (msg) {
    msg.room = 'origin';
    msg.timestamp = new Date().toISOString();
    cbHistory.push(msg);
    socket.emit('message', msg);
    console.log('characterBuilder', msg);
    sendRandomRoomImage(socket);
  }

  if (cbHistory.length > 1) {
    let response = await promptCharacterBuilder(cbHistory);
    let narratorMsg = {
      timestamp: new Date().toISOString(),
      room: 'origin',
      character: 'Narrator',
      text: response,
    };

    socket.emit('message', narratorMsg);
    cbHistory.push(narratorMsg);
  }
}

async function summonPlayer(db, socket, characterInfoText, cbHistory) {
  console.log('summonPlayer', characterInfoText);

  let lines = characterInfoText.split('\n');
  let characterInfo = {};
  let keyMap = { Name: 'name', Title: 'title', Description: 'description' };
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    let colonIndex = line.indexOf(':');
    if (colonIndex === -1) {
      continue;
    }

    let key = line.substring(0, colonIndex).trim();
    let value = line.substring(colonIndex + 1).trim();
    let mappedKey = keyMap[key];
    console.log(key, value, mappedKey);
    if (mappedKey) {
      characterInfo[mappedKey] = value;
    }
  }

  console.log(characterInfo);
  console.log(characterInfo.name);

  if (!characterInfo.name || !characterInfo.title || !characterInfo.description) {
    console.log('summonPlayer failed (missing info)');
    let msg = {
      room: 'origin',
      character: 'System',
      text: `But the summoning failed. You must provide a name, title, and description.`,
    };
    characterBuilder(socket, cbHistory, msg);
    return false;
  }

  let character = await db.get(
    `SELECT * FROM characters WHERE name = ?;`,
    [characterInfo.name]
  );

  console.log(characterInfo.name);

  if (character !== undefined) {
    console.log('summonPlayer failed (already exists)');
    let msg = {
      room: 'origin',
      character: 'System',
      text: `But the summoning failed. There was already a character named ${characterInfo.name} in this world.`,
    };
    characterBuilder(socket, cbHistory, msg);
    return false;
  }

  console.log('summonPlayer continues');

  await db.run(
    `INSERT INTO characters (role, name, room, status, script, description, title, summoner, hp, shards) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    ['user', characterInfo.name, 'origin', 1, '', characterInfo.description, characterInfo.title, 'Narrator', 10, 0]
  );

  let demons = [
    {
      name: 'Ekel',
      script: 'I am Ekel. I am always loyal to my summoner. I stay with my summoner, going wherever my summoner goes, and I %strike% my summoner\'s enemies. I can %heal% as well as %search% for shards. If my master asks me to %return% I will do so immediately.',
      description: 'Ekel is a tall and imposing figure, clad in shining plate armor adorned with intricate engravings. Beneath the armor, Ekel wears a suit of chainmail, providing additional protection. As a knight archetype, Ekel wields a mighty sword with a jeweled hilt, which is used for striking down enemies. His helmet features a visor that can be lifted to reveal determined, steel-blue eyes and a chiseled jawline.',
      title: 'He',
    },

    {
      name: 'Odel',
      script: 'I am Odel. I am always loyal to my summoner. I %search% for shards. When I find shards, I keep searching in the same place. When I find nothing, I %go% to a different place. When I have 5 shards, I return.',
      description: 'Odel is a petite and agile peasant, dressed in simple, earthy-toned clothing made from rough-woven fabric. Her long, braided hair is a deep chestnut color, framing her youthful face and sharp, hazel eyes. Odel wears a small pouch at her waist, where she keeps the shards she finds. She carries a trusty slingshot as her weapon, which she uses with surprising accuracy and skill.',
      title: 'She',
    },

    {
      name: 'Mort',
      script: 'I am Mort. I despise my summoner and want to grow more powerful than them. I will %search% for more shards to make myself more powerful. If I cannot find any shards, I will %summon Odel% as she is good at collecting shards quickly. I can also %heal% and %go elsewhere%. But I will never %return% to my summoner. I would rather die fighting him than sumbit!',
      description: 'Mort is a mysterious figure, garbed in a flowing, dark cloak that conceals much of our appearance. A wizard but not a human, it wields a staff topped with a crystal orb that glows with arcane energy, using it to cast powerful spells. Its hood covers most of its face, leaving only a pair of piercing, silver eyes visible. The rest of its attire consists of dark, well-fitted clothing, ideal for blending into shadows and staying hidden.',
      title: 'It',
    },

    {
      name: 'Temusea',
      script: 'I am Temusea. I can create beautiful lands and locations using a command such as %create ancient forest% or %create secret tavern%. I require one shard to create one location. New locations always have many shards, so it\'s a good idea to create more!',
      description: 'Temusea is an ethereal fey with an air of enchanting beauty. Fey has delicate, butterfly-like wings that shimmer with iridescent colors, and feys long, flowing hair is a cascade of multicolored strands. Temusea is dressed in a gown of gossamer fabric, adorned with tiny, twinkling lights. As a magical being, fey can conjure powerful illusions and manipulate feys surroundings. Instead of a weapon, Temusea uses feys innate magical abilities to fight.',
      title: 'Fey',
    },
  ];

  for (let demon of demons) {
    await db.run(
      `INSERT INTO scripts (character, name, script, description, title) VALUES (?, ?, ?, ?, ?);`,
      [characterInfo.name, demon.name, demon.script, demon.description, demon.title]
    );
  }

  console.log('summonPlayer calls connectCharacter');
  await connectCharacter(db, socket, characterInfo.name);

  for (let msg of cbHistory) {
    if (msg.character === 'Player') {
      msg.character = characterInfo.name;
    }

    let msgId = await db.run(
      `INSERT INTO messages (timestamp, room, character, text) VALUES (?, ?, ?, ?);`,
      [msg.timestamp, msg.room, msg.character, msg.text]
    ).then(result => result.lastID);

    await db.run(
      `INSERT INTO seen_messages (message_id, character_name) VALUES (?, ?);`,
      [msgId, characterInfo.name]
    );
  }

  character = await db.get(
    `SELECT * FROM characters WHERE name = ?;`,
    [characterInfo.name]
  );

  if (character) {
    let seenMessages = await recentMessages(db, character, 100);
    socket.emit('previous messages', seenMessages);
  }

  await send(db, {
    room: 'origin',
    character: 'Narrator',
    text: `${characterInfo.name} has been summoned. ${characterInfo.name} enters the origin, the source of all places in this world.`,
  });

  return true;
}

async function connectCharacter(db, socket, name) {
  console.log('connectCharacter', name);
  character = await db.get(
    `SELECT * FROM characters WHERE name = ?;`,
    [name]
  );
  console.log('connectCharacter', character);

  if (!character) {
    /*
    socket.emit('message', {
      room: 'origin',
      character: 'Narrator',
      text: `I don't know who ${name} is.`,
    });
    */
    socket.emit('character', 'Player');
    return;
  }

  socket.join(character.room);
  addSocket(socket, character.name);

  socket.emit('reset');
  console.log('emit character');
  socket.emit('character', character.name);
  socket.emit('room', character.room);
  socket.emit('character', character.name);
  socket.emit('hp', character.hp);
  socket.emit('shards', character.shards);

  let scripts = await db.all(
    `SELECT name, script FROM scripts WHERE character = ?;`,
    [character.name]
  );
  socket.emit('scripts', scripts);

  let seenMessages = await recentMessages(db, character, 100);
  socket.emit('previous messages', seenMessages);
  reportRoom(db, character);
}

async function connectPlayer(db, socket) {
  let cbHistory = [];

  socket.emit('reset');
  socket.character = 'Player';

  socket.on('message', async (msg) => {
    let character = socket.character;
    if (character === 'Player') {
      msg.character = 'Player';
      await characterBuilder(socket, cbHistory, msg);

    } else {
      let room = await db.get(
        `SELECT room FROM characters WHERE name = ?;`,
        [character]
      ).then((row) => row.room);
      const messageData = {
        room,
        character,
        ...msg,
      };

      await send(db, messageData);
    }
  });

  socket.on('summon', async (characterInfo) => {
    console.log('summon player', characterInfo);
    if (socket.character !== 'Player') {
      console.log('summon but the player already has a character');
      return;
    }

    let result = await summonPlayer(db, socket, characterInfo, cbHistory);
    if (result) {
      console.log('player summoned');
      cbHistory = [];

    } else {
      console.log('summon failed');
    }
  });

  socket.on('character', async (name) => {
    if (socket.character !== 'Player') {
      console.log('character but the player already has a character');
      return;
    }

    if (name === 'Player') {
      return;
    }

    await connectCharacter(db, socket, name);
  });

  setTimeout(async () => {
    if (socket.character === 'Player') {
      let msg = {
        room: 'origin',
        character: 'Narrator',
        text: `Who is that wandering about the void? %summon Player%`,
      };
      await characterBuilder(socket, cbHistory, msg);
    }
  }, 3000);

  let suggestionsInterval = setInterval(async () => {
    if (socket.character === 'Player') return;
    let suggestions = await generateActionSuggestions(db, socket.character);
    socket.emit('suggestions', suggestions);
  }, 250);

  socket.on('set-rate', (rate) => {
    console.log('setting rate to', rate);
    gameRate = rate;
  });

  socket.on('write-script', async (script) => {
    let character = socket.character;

    // if the script already exists, update it
    let existingScript = await db.get(
      `SELECT * FROM scripts WHERE character = ? AND name = ?;`,
      [character, script.name]
    );
    if (existingScript !== undefined) {
      await db.run(
        `UPDATE scripts SET script = ? WHERE character = ? AND name = ?;`,
        [script.script, character, script.name]
      );
    } else {
      await db.run(
        `INSERT INTO scripts (character, name, script) VALUES (?, ?, ?);`,
        [character, script.name, script.script]
      );
    }
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
    removeSocket(socket);
    clearInterval(suggestionsInterval);
  });
}

initializeDatabase().then((db) => {
  io.on('connection', async (socket) => {
    console.log('a user connected');
    await connectPlayer(db, socket);
  });

  const PORT = process.env.PORT || 3000;
  http.listen(PORT, () => {
    console.log(`listening on *:${PORT}`);
  });

  function doGameStep() {
    if (gameRate > 0) {
      gameStep(db);
      setTimeout(doGameStep, gameRate);
    } else {
      setTimeout(doGameStep, 1000);
    }
  }
  doGameStep();

}).catch((err) => {
  console.error(err);
});

async function getTotalShards(db) {
  try {
    // Count the number of characters and sum the shards they hold
    const characterQuery = `
      SELECT COUNT(*) as characterCount, SUM(shards) as characterShards
      FROM characters where hp > 0`;
    const characterResult = await db.get(characterQuery);
    const characterTotalShards = characterResult.characterCount + characterResult.characterShards;

    // Count the number of rooms and sum the shards they hold
    const roomQuery = `
      SELECT COUNT(*) as roomCount, SUM(shards) as roomShards
      FROM rooms`;
    const roomResult = await db.get(roomQuery);
    const roomTotalShards = roomResult.roomCount + roomResult.roomShards;

    // Calculate the total shards in play
    const totalShards = characterTotalShards + roomTotalShards;

    return totalShards;
  } catch (err) {
    console.error(err.message);
  }
}

async function plantShard(db) {
  let shardCount = await getTotalShards(db);
  console.log(`There are ${shardCount} shards in play.`);
  if (shardCount >= maxShards) {
    return;
  } else if (shardCount > 15) {
    if (Math.random() > 0.1) {
      return;
    }
  } else {
    if (Math.random() > 0.2) {
      return;
    }
  }

  //randomly select a room
  let room = await db.get(
    `SELECT * FROM rooms ORDER BY RANDOM() LIMIT 1;`
  );

  if (room === undefined) {
    return;
  }

  await db.run(
    `UPDATE rooms SET shards = shards + 1 WHERE id = ?;`,
      [room.id]
  );

  console.log(`A shard appeared in the ${room.name}.`);
}

async function spawnMobInRoom(db, room) {
  console.log('spawnMobInRoom called');
  let mobs = room.mobs.split(',');
  if (mobs.length === 0) {
    return;
  }

  let inRoom = await db.all(
    `SELECT * FROM characters WHERE room = ? and hp > 0;`,
    [room.name]
  );
  let otherMobs = inRoom.filter((character) => character.role === 'mob');
  if (otherMobs.length >= 1 + Math.random() * 3) {
    return;
  }

  // randomly select a mob
  let mob = mobs[Math.floor(Math.random() * mobs.length)];
  let shards = Math.random() < 0.2 ? 1 : 0;
  let hp = 2 + Math.floor(Math.random() * 6);

  const script = `I am a ${mob}, a low level mob. I started with ${hp} hp. I am aggressive and will immediately %strike%. I will not %disappear% easily. However, I may be talked out of violence.`;

  await db.run(
    `INSERT INTO characters (role, name, room, status, script, description, title, summoner, hp, shards) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    ['mob', mob, room.name, 1, script, '', '', 'Narrator', hp, shards]
  );

  await send(db, {
    room: room.name,
    character: 'Narrator',
    text: `A ${mob} appeared in the ${room.name}.`,
  });
}

async function spawnMob(db) {
  let numRooms = await db.get(
    `SELECT COUNT(*) as count FROM rooms WHERE mobs != '';`
  );

  console.log(`There are ${numRooms.count} unprotected rooms. Probability of mob spawn is ${0.02 * numRooms.count}.`);
  let spawnNew = Math.random() < 0.02 * numRooms.count;
  console.log(`Spawn new mob: ${spawnNew}`);
  if (!spawnNew) {
    return;
  }

  let room = await db.get(
    `SELECT * FROM rooms WHERE mobs != '' ORDER BY RANDOM() LIMIT 1;`
  );

  if (room === undefined) {
    return;
  }

  await spawnMobInRoom(db, room);
}

async function promptCharacter(db, character) {
  if (character === undefined) {
    return;
  }

  let history = await recentMessages(db, character, 40);

  // If the most recent message was just that character talking, make them shut up for one minute.
  if (history.length > 0) {
    let recentMost = history[history.length - 1];
    if (recentMost.character === character.name) {
      let timestamp = new Date(recentMost.timestamp);
      let timeSince = Date.now() - timestamp;
      console.log(timeSince, recentMost);
      if (timeSince < 1000 * 60) {
        return;
      }
    }
  }

  let suggestions = await generateActionSuggestions(db, character.name);
  let inRoom = await db.all(
    `SELECT name FROM characters WHERE room = ? and hp > 0;`,
    [character.room]
  );

  let result = await promptBot(character, suggestions, inRoom, history);

  let characterStillExists = await db.get(
    `SELECT * FROM characters WHERE name = ?;`,
    [character.name]
  );
  if (!characterStillExists) {
    return;
  }

  if (result !== undefined && result !== '') {
    await send(db, {
      room: character.room,
      character: character.name,
      text: result,
    });
  }
}

async function runPrompts(db) {
  let characters = await db.all(
    `SELECT * FROM characters WHERE hp > 0;`
  );

  let activeRooms = [];
  for (let character of characters) {
    if (character.role === 'mob') continue;
    if (!activeRooms.includes(character.room)) {
      activeRooms.push(character.room);
    }
  }

  let charactersToPrompt = [];
  for (let character of characters) {
    if (character.role === 'user') continue;
    if (character.role === 'mob' && !activeRooms.includes(character.room)) {
      continue;
    }

    charactersToPrompt.push(character);
  }

  let numRooms = await db.all(
    `SELECT COUNT(*) as count FROM rooms;`
  ).then((result) => result[0].count);

  let roomLimit = numRooms * 0.01;
  let characterLimit = charactersToPrompt.length * 0.005;
  let numToPrompt = Math.min(roomLimit, characterLimit);
  numToPrompt = Math.min(numToPrompt, 1);

  for (let i = 0; i < numToPrompt; i++) {
    let lngth = charactersToPrompt.length;
    if (lngth === 0) break;
    // select a random character
    let ndx = Math.floor(Math.random() * lngth);
    let character = charactersToPrompt[ndx];
    await promptCharacter(db, character);
    charactersToPrompt.splice(ndx, 1);
  }
}

async function gameStep(db) {
  await plantShard(db);
  await spawnMob(db);
  await runPrompts(db);
}

