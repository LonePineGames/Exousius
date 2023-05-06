const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const sqlite3 = require('sqlite3').verbose();
const sqlite = require('sqlite');
const dbFile = './world.db';
const RomanNumerals = require('roman-numerals');
const { promptBot } = require('./prompt');

let gameRate = 10000;
let socketTable = [];

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
    await db.run(`INSERT INTO rooms (name, description, shards) VALUES ('origin', 'The origin of all things.', 0);`);

    await db.run(`INSERT INTO rooms (name, description, shards) VALUES ('forest', 'A beautiful enchanted forest.', 0);`);

    await db.run(`INSERT INTO rooms (name, description, shards) VALUES ('caves', 'Spooky caves.', 0);`);
  }

  return db;
}

async function send(db, messageData) {
  const message = {
    timestamp: new Date().toISOString(),
    ...messageData,
  };

  console.log(`${message.character} (${message.room}): ${message.text}`);

  message.id = await db.run(
    `INSERT INTO messages (room, character, text, timestamp) VALUES (?, ?, ?, ?);`,
    [message.room, message.character, message.text, message.timestamp]
  ).then((result) => result.lastID);

  let charactersInRoom = await db.all(
    `SELECT name FROM characters WHERE room = ?;`,
    [message.room]
  );

  charactersInRoom.forEach(async (character) => {
    await db.run(
      `INSERT INTO seen_messages (message_id, character_name) VALUES (?, ?);`,
      [message.id, character.name]
    );
  });

  io.to(message.room).emit('message', message);

  await processActions(db, message);
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
    const previousRoom = character.room;
    if (room === previousRoom) {
      await send(db, {
        room: character.room,
        character: 'Narrator',
        text: `But ${character.name} was already in the ${room}.`,
      });
      return;
    }

    let roomExists = await db.get(
      `SELECT name FROM rooms WHERE name = ?;`,
      [room]
    ).then((row) => row !== undefined);

    if (!roomExists) {
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

    socketTable.filter((entry) => entry.character === character.name).forEach((entry) => {
      entry.socket.leave(previousRoom);
      entry.socket.join(room);
      entry.socket.emit('room', room);
    });

    await send(db, {
      room: room,
      character: 'Narrator',
      text: `${character.name} appeared in the ${room}.`,
    });

    await send(db, {
      room: previousRoom,
      character: 'Narrator',
      text: `${character.name} left to go to the ${room}.`,
    });
  },

  async create(db, character, action) {
    console.log('create', action.text, character.name);
    const room = action.text;
    let roomExists = await db.get(
      `SELECT name FROM rooms WHERE name = ?;`,
      [room]
    ).then((row) => row !== undefined);

    if (roomExists) {
      await send(db, {
        room: character.room,
        character: 'Narrator',
        text: `But ${character.name} couldn't create the ${room} because it already existed.`,
      });
      return;
    }

    if (!await spendShard(db, character)) {
      await send(db, {
        room: character.room,
        character: 'Narrator',
        text: `But ${character.name} couldn't create the ${room} because they don't have any shards.`,
      });
      return;
    }

    await db.run(
      `INSERT INTO rooms (name, description, shards) VALUES (?, ?, ?);`,
      [room, 'A new room.', 0]
    );

    await send(db, {
      room: character.room,
      character: 'Narrator',
      text: `${character.name} used a shard and created the ${room}.`,
    });

    await executeAction(db, character, { name: 'go', text: room });
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
      `SELECT * FROM characters WHERE room = ?;`,
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

    await send(db, {
      room: character.room,
      character: 'Narrator',
      text: `${character.name} used a shard and summoned ${summonInstance}.`,
    });

    console.log(script);

    await db.run(
      `INSERT INTO characters (role, name, room, script, summoner, hp, shards) VALUES (?, ?, ?, ?, ?, ?, ?);`,
      ['bot', summonInstance, character.room, script.script, character.name, 10, 0]
    );
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

    let message = `${character.name} struck ${target.name} for ${damage} damage.`;
    if (sacrifice > 0) {
      message += ` ${target.name} sacrificed ${sacrifice} shards to stay alive.`;
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

      await db.run(
        `DELETE FROM characters WHERE name = ?;`,
        [target.name]
      );
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
  }
};

actionHandlers['return'] = async function(db, character, action) {
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
    text: `${character.name} returned to ${character.summoner} and restored ${shards} shards.`,
  };
  await send(db, message);

  if (character.room !== summonerRoom) {
    message.room = character.room;
    await send(db, message);
  }

  await db.run(
    `DELETE FROM characters WHERE name = ?;`,
    [character.name]
  );
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
    if (character.role === 'bot') {
      return [];
    }

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
      .filter((ch) => ch.name !== character.name)
      .map((ch) => `%strike ${ch.name}%`);

    let heal = validCharacters
      .filter((ch) => ch.hp < 10 && ch.name !== character.name)
      .map((ch) => `%heal ${ch.name}%`);

    let me = validCharacters.find((ch) => ch.name === character.name);
    if (me !== undefined && me.hp < 10) {
      heal.push('%heal%');
    }

    return strike.concat(heal);
  },
];

async function generateActionSuggestions(db, characterName) {
  let character = await db.get(
    `SELECT * FROM characters WHERE name = ?;`,
    [characterName]
  );

  let promises = actionSuggestions.map(async (func) => {
    return await func(db, character);
  });

  let suggestions = await Promise.all(promises);
  suggestions = suggestions.reduce((acc, val) => acc.concat(val), []);

  return suggestions;
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

    const name = 'Being';

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
        [name, 'Ekel', 'I am Ekel. I am always loyal to my summoner. I stay with my summoner, going wherever my summoner goes, and I strike my summoner\'s enemies. If I do not have any instructions from my summoner, I will remain silent.']
      );

      await db.run(
        `INSERT INTO scripts (character, name, script) VALUES (?, ?, ?);`,
        [name, 'Odel', 'I am Odel. I am always loyal to my summoner. I search for shards. When I find shards, I keep searching in the same place. When I find nothing, I go to a different place. When I have 5 shards, I return.']
      );

      await db.run(
        `INSERT INTO scripts (character, name, script) VALUES (?, ?, ?);`,
        [name, 'Mort', 'I am Mort. I despise my summoner. I will strike my summoner until death.']
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

    try {
      let seenMessages = await recentMessages(db, character, 100);
      console.log(seenMessages);
      socket.emit('previous messages', seenMessages);
    } catch (err) {
      console.error(err.message);
    }

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
      FROM characters`;
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
  // compute the number of shards in play
  let shardCount = await getTotalShards(db);
  console.log(`There are ${shardCount} shards in play.`);

  if (shardCount < 100) {
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

  await promptOnce(db);
}

async function promptOnce(db) {
  // randomly select a character
  let character = await db.get(
    `SELECT * FROM characters WHERE role = 'bot' ORDER BY RANDOM() LIMIT 1;`
  );

  if (character === undefined) {
    return;
  }

  let suggestions = await generateActionSuggestions(db, character.name);
  let inRoom = await db.all(
    `SELECT name FROM characters WHERE room = ?;`,
    [character.room]
  );
  console.log(inRoom);
  let history = await recentMessages(db, character, 20);

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

