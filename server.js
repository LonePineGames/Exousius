const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const sqlite3 = require('sqlite3').verbose();
const sqlite = require('sqlite');
const dbFile = './world.db';

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

  await makeTable('messages', `
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room TEXT NOT NULL,
      character TEXT NOT NULL,
      text TEXT NOT NULL,
      timestamp TEXT NOT NULL`);

  await makeTable('characters', `
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      room TEXT NOT NULL,
      hp INTEGER NOT NULL,
      shards INTEGER NOT NULL`);

  await makeTable('rooms', `
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      shards INTEGER NOT NULL`);

  let originExists = await db.get(
    `SELECT name FROM rooms WHERE name = 'origin';`
  ).then((row) => row !== undefined);
  if (!originExists) {
    await db.run(`INSERT INTO rooms (name, description, shards) VALUES ('origin', 'The origin of all things.', 0);`);
  }

  return db;
}

async function send(db, message) {
  const messageData = {
    timestamp: new Date().toISOString(),
    ...message,
  };

  console.log(messageData);

  try {
    await db.run(
      `INSERT INTO messages (room, character, text, timestamp) VALUES (?, ?, ?, ?);`,
      [messageData.room, messageData.character, messageData.text, messageData.timestamp]
    );

    console.log('Message inserted into the database.');

    io.to(message.room).emit('message', messageData);

    await processActions(db, messageData);
  } catch (err) {
    console.error(err.message);
  }
}

async function processActions(db, message) {
  const actions = parseActions(message.text);

  if (actions.length === 0) {
    return;
  }

  let character = { name: message.character, room: message.room };

  for (const action of actions) {
    await executeAction(db, character, action);
  }
}

async function executeAction(db, character, action) {
  const actionHandler = actionHandlers[action.name];
  if (actionHandler) {
    await actionHandler(db, character, action);
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

const actionHandlers = {
  async go(db, character, action) {
    console.log('go', action.text, character.name);
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
        text: `${character.name} found nothing.`,
      });
    }
  },
};

app.use(express.static('public'));

let socketTable = [];

function addSocket(socket, character) {
  socketTable.push({ socket, character });
}

function removeSocket(socket) {
  socketTable = socketTable.filter((entry) => entry.socket !== socket);
}

initializeDatabase().then((db) => {
  io.on('connection', async (socket) => {
    console.log('a user connected');

    const defaultRoom = 'origin';
    const defaultUsername = 'Anonymous' + Math.floor(Math.random() * 1000);
    const defaultShards = 0;
    const defaultHp = 10;
    socket.join(defaultRoom);
    addSocket(socket, defaultUsername);

    await db.run(
      `INSERT INTO characters (name, room, hp, shards) VALUES (?, ?, ?, ?);`,
      [defaultUsername, defaultRoom, defaultHp, defaultShards]
    );

    socket.emit('reset');
    socket.emit('room', defaultRoom);
    socket.emit('character', defaultUsername);
    socket.emit('hp', defaultHp);
    socket.emit('shards', defaultShards);

    try {
      const rows = await db.all(
        `SELECT * FROM messages WHERE room = ? ORDER BY timestamp DESC LIMIT 10;`,
        [defaultRoom]
      );
      socket.emit('previous messages', rows.reverse());
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

      send(db, messageData);
    });

    socket.on('disconnect', () => {
      console.log('user disconnected');
      removeSocket(socket);
    });
  });

  const PORT = process.env.PORT || 3000;
  http.listen(PORT, () => {
    console.log(`listening on *:${PORT}`);
  });

  function doGameStep() {
    gameStep(db);
    setTimeout(doGameStep, 1000);
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

  if (shardCount < 10) {
    //randomly select a room
    let room = await db.get(
      `SELECT id FROM rooms ORDER BY RANDOM() LIMIT 1;`
    ).then((row) => row.id);

    await db.run(
      `UPDATE rooms SET shards = shards + 1 WHERE id = ?;`,
      [room]
    );

    console.log(`A shard appeared in room ${room}.`);
  }
}

