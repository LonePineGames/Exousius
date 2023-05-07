const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const sqlite3 = require('sqlite3').verbose();
const sqlite = require('sqlite');
const dbFile = './world.db';
const RomanNumerals = require('roman-numerals');
const { promptBot, punchUpNarration, describePlace, createPicture } = require('./prompt');
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
      script TEXT NOT NULL,
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
      shards INTEGER NOT NULL`);

  await makeTable('scripts', `
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      character TEXT NOT NULL,
      name TEXT NOT NULL,
      script TEXT NOT NULL`);

  let originExists = await db.get(
    `SELECT name FROM rooms WHERE name = 'origin';`
  ).then((row) => row !== undefined);
  if (!originExists) {
    await db.run(`INSERT INTO rooms (name, description, image_url, shards) VALUES ('origin', 'The origin void. Infinite, empty black space.', '', 0);`);

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
    await send(db, {
      room: character.room,
      character: 'Narrator',
      text: `But ${character.name} didn't know how to ${action.name}.`,
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

  socketTable.filter((entry) => entry.character === character.name).forEach((entry) => {
    entry.socket.emit('shards', newShards);
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
    socketTable.filter((entry) => entry.character === character.name).forEach(async (entry) => {
      entry.socket.leave(previousRoom);
      entry.socket.join(room);
      entry.socket.emit('room', room);
      playerInRoom = true;
    });

    await send(db, {
      room: room,
      character: 'Narrator',
      text: `${character.name} traveled to the ${room}.`,
    });

    await send(db, {
      room: previousRoom,
      character: 'Narrator',
      text: `${character.name} left to go to the ${room}.`,
    });

    if (playerInRoom) {
      reportRoom(db, character, room);
    }
  },

  async create(db, character, action) {
    console.log('create', action.text, character.name);
    const roomName = action.text;
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
    let initShards = Math.max(0, Math.min(maxShards - totalShards, 5));
    console.log("initShards", initShards);

    let id = await db.run(
      `INSERT INTO rooms (name, description, image_url, shards) VALUES (?, ?, ?, ?);`,
      [roomName, '', '', initShards]
    ).then((result) => result.lastID);

    await send(db, {
      room: character.room,
      character: 'Narrator',
      text: `${character.name} used a shard and created the ${roomName}.`,
    });

    let history = await db.all(
      `SELECT * FROM messages WHERE room = ? ORDER BY id DESC LIMIT 10;`,
      [character.room]
    );
    let description = await describePlace(character, history, roomName);

    await db.run(
      `UPDATE rooms SET description = ? WHERE id = ?;`,
      [description, id]
    );

    await send(db, {
      room: roomName,
      character: character.name,
      text: `%go ${roomName}%`,
    });

    let picture = await createPicture(description);

    await db.run(
      `UPDATE rooms SET image_url = ? WHERE id = ?;`,
      [picture, id]
    );

    console.log('picture', picture);

    socketTable.forEach(async (entry) => {
      let characterRoom = await db.get(
        `SELECT room FROM characters WHERE name = ?;`,
        [entry.character]
      ).then((row) => row.room);

      if (characterRoom === roomName) {
        entry.socket.emit('background-image', picture);
      }
    });
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
        text: `${character.name} found a shard.`,
      });

      let characterShards = await db.get(
        `SELECT shards FROM characters WHERE name = ?;`,
        [character.name]
      ).then((row) => row.shards);

      socketTable.filter((entry) => entry.character === character.name).forEach((entry) => {
        entry.socket.emit('shards', characterShards);
      });

    } else {
      await send(db, {
        room: character.room,
        character: 'Narrator',
        text: `But ${character.name} found nothing.`,
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
      `INSERT INTO characters (role, name, room, script, summoner, hp, shards) VALUES (?, ?, ?, ?, ?, ?, ?);`,
      ['bot', summonInstance, character.room, script.script, character.name, 10, 0]
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
    let target = await db.get(
      `SELECT * FROM characters WHERE name = ?;`,
      [targetName]
    );

    if (target === undefined) {
      await send(db, {
        room: character.room,
        character: 'Narrator',
        text: `But ${character.name} couldn't strike ${targetName} because ${targetName} didn't exist.`,
      });
      return;
    }

    if (target.hp <= 0) {
      await send(db, {
        room: character.room,
        character: 'Narrator',
        text: `But ${character.name} couldn't strike ${target.name} because ${target.name} was already dead.`,
      });
      return;
    }

    if (target.room !== character.room) {
      await send(db, {
        room: character.room,
        character: 'Narrator',
        text: `But ${character.name} couldn't strike ${target.name} because ${target.name} wasn't in the ${character.room}`,
      });
      return;
    }

    let damage = 1 + character.shards;
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
    await send(db, {
      room: character.room,
      character: 'Narrator',
      text: message,
    });


    await db.run(
      `UPDATE characters SET hp = ?, shards = ? WHERE name = ?;`,
      [target.hp, target.shards, target.name]
    );

    if (target.hp <= 0) {
      await send(db, {
        room: character.room,
        character: 'Narrator',
        text: `${target.name} died.`,
      });

      /*
      await db.run(
        `DELETE FROM characters WHERE name = ?;`,
        [target.name]
      );
      */
    }

    socketTable.filter((entry) => entry.character === target.name).forEach((entry) => {
      entry.socket.emit('hp', target.hp);
      entry.socket.emit('shards', target.shards);
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

    await send(db, {
      room: character.room,
      character: 'Narrator',
      text: `${character.name} healed ${target.name} for ${heal}HP.`,
    });

    target.hp += heal;

    await db.run(
      `UPDATE characters SET hp = ? WHERE id = ?;`,
      [target.hp, target.id]
    );

    socketTable.filter((entry) => entry.character === target.name).forEach((entry) => {
      entry.socket.emit('hp', target.hp);
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

    socketTable.forEach((entry) => {
      if (entry.character === target.name) {
        entry.socket.emit('shards', target.shards);
      }
      if (entry.character === character.name) {
        entry.socket.emit('shards', character.shards);
      }
    });
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

  socketTable.filter((entry) => entry.character === character.summoner).forEach((entry) => {
    entry.socket.emit('shards', summoner.shards);
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
    const rooms = await db.all(
      `SELECT name FROM rooms where name != ?;`,
      [character.room]
    );

    return rooms.map((room) => `%go ${room.name}%`);
  },

  async function summonSuggestions(db, character) {
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
    return scripts.map((script) => `%summon ${script.name}%`);
  },

  async function searchSuggestions(db, character) {
    return ['%search%'];
  },

  async function returnSuggestions(db, character) {
    if (character.role === 'bot') {
      return ['%return%'];
    } else {
      return [];
    }
  },

  async function strikeHealSuggestions(db, character) {
    let validCharacters = await db.all(
      `SELECT * FROM characters WHERE room = ?;`,
      [character.room]
    );

    let strike = validCharacters
      .filter((ch) => ch.name !== character.name && ch.hp > 0)
      .map((ch) => `%strike ${ch.name}%`);

    let heal = validCharacters
      .filter((ch) => ch.hp < 10 && ch.shards >= 0 && ch.name !== character.name)
      .map((ch) => `%heal ${ch.name}%`);

    let me = validCharacters.find((ch) => ch.name === character.name);
    if (me !== undefined && me.hp < 10) {
      heal.push('%heal%');
    }

    return strike.concat(heal);
  },

  async function giveSuggestions(db, character) {
    if (character.shards <= 0) {
      return [];
    }

    let shardsToGive = character.role === 'bot' ? character.shards : 1;

    let validCharacters = await db.all(
      `SELECT * FROM characters WHERE room = ?;`,
      [character.room]
    );

    let give = validCharacters
      .filter((ch) => ch.name !== character.name && ch.hp > 0)
      .map((ch) => `%give ${ch.name} ${shardsToGive}%`);

    return give;
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

  socketTable.filter((entry) => entry.character === character.name).forEach((entry) => {
    entry.socket.emit('message', {
      timestamp: new Date().toISOString(),
      room: character.room,
      character: 'Narrator',
      text: `${room.description} In the ${room.name} was ${listNames(characters)}.`,
    });

    console.log("reportRoom url", room.image_url);
    entry.socket.emit('background-image', room.image_url);
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
  socketTable.push({ socket, character });
}

function removeSocket(socket) {
  socketTable = socketTable.filter((entry) => entry.socket !== socket);
}

initializeDatabase().then((db) => {
  io.on('connection', async (socket) => {
    console.log('a user connected');

    const name = 'Arkim';

    let character = await db.get(
      `SELECT * FROM characters WHERE name = ?;`,
      [name]
    );

    console.log(character);

    if (character === undefined) {
      await db.run(
        `INSERT INTO characters (role, name, room, script, summoner, hp, shards) VALUES (?, ?, ?, ?, ?, ?, ?);`,
        ['user', name, 'origin', '', 'Self', 10, 0]
      );

      await db.run(
        `INSERT INTO scripts (character, name, script) VALUES (?, ?, ?);`,
        [name, 'Ekel', 'I am Ekel. I am always loyal to my summoner. I stay with my summoner, going wherever my summoner goes, and I %strike% my summoner\'s enemies. If my master asks me to %return% I will do so immediately.']
      );

      await db.run(
        `INSERT INTO scripts (character, name, script) VALUES (?, ?, ?);`,
        [name, 'Odel', 'I am Odel. I am always loyal to my summoner. I %search% for shards. When I find shards, I keep searching in the same place. When I find nothing, I %go% to a different place. When I have 5 shards, I return.']
      );

      await db.run(
        `INSERT INTO scripts (character, name, script) VALUES (?, ?, ?);`,
        [name, 'Mort', 'I am Mort. I despise my summoner. I will %strike% my summoner until death. If my summoner is not nearby, I will %search% for more shards to make myself more powerful. I can also %summon% other demons. Odel is good at collecting shards quickly. Another Mort would be a vital ally.']
      );

      await db.run(
        `INSERT INTO scripts (character, name, script) VALUES (?, ?, ?);`,
        [name, 'Temusea', 'I am Temusea. I can create beautiful lands and locations using a command such as %create ancient forest%. But before I can create wonderful new locations for the game, I must acquire shards, either from my summoner or by %search%. Once I have shards, I can start creating and worldbuilding!']
      );

      character = await db.get(
        `SELECT * FROM characters WHERE name = ?;`,
        [name]
      );
    }

    socket.join(character.room);
    addSocket(socket, character.name);

    socket.emit('reset');
    socket.emit('room', character.room);
    socket.emit('character', character.name);
    socket.emit('hp', character.hp);
    socket.emit('shards', character.shards);

    let suggestions = await generateActionSuggestions(db, character.name);
    socket.emit('suggestions', suggestions);

    let suggestionsInterval = setInterval(async () => {
      let suggestions = await generateActionSuggestions(db, character.name);
      socket.emit('suggestions', suggestions);
    }, 250);

    let scripts = await db.all(
      `SELECT name, script FROM scripts WHERE character = ?;`,
      [character.name]
    );
    socket.emit('scripts', scripts);

    let seenMessages = await recentMessages(db, character, 100);
    socket.emit('previous messages', seenMessages);
    reportRoom(db, character);

    socket.on('message', async (msg) => {
      let character = socketTable.find((entry) => entry.socket === socket).character;
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

      //let suggestions = await generateActionSuggestions(db, character);
      //socket.emit('suggestions', suggestions);
    });

    socket.on('set-rate', (rate) => {
      console.log('setting rate to', rate);
      gameRate = rate;
    });

    socket.on('write-script', async (script) => {
      let character = socketTable.find((entry) => entry.socket === socket).character;

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

async function gameStep(db) {
  if (Math.random() < 0.1) {
    // compute the number of shards in play
    let shardCount = await getTotalShards(db);
    console.log(`There are ${shardCount} shards in play.`);

    if (shardCount < maxShards) {
      //randomly select a room
      let room = await db.get(
        `SELECT * FROM rooms ORDER BY RANDOM() LIMIT 1;`
      );

      if (room !== undefined) {
        await db.run(
          `UPDATE rooms SET shards = shards + 1 WHERE id = ?;`,
          [room.id]
        );

        console.log(`A shard appeared in the ${room.name}.`);
      }
    }
  }

  await promptOnce(db);
}

async function promptOnce(db) {
  // randomly select a character
  let character = await db.get(
    `SELECT * FROM characters WHERE role = 'bot' and hp > 0 ORDER BY RANDOM() LIMIT 1;`
  );

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

