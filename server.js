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
      room TEXT NOT NULL`);

  await makeTable('rooms', `
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL`);

  await db.run(`INSERT INTO rooms (name, description) VALUES ('origin', 'The origin of all things.');`);

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

    await process_actions(db, messageData);
  } catch (err) {
    console.error(err.message);
  }
}

async function process_actions(db, message) {
  const actions = parse_actions(message.text);

  if (actions.length === 0) {
    return;
  }

  let character = { name: message.character, room: message.room };

  for (const action of actions) {
    await execute_action(db, character, action);
  }
}

async function execute_action(db, character, action) {
  const action_handler = action_handlers[action.name];
  if (action_handler) {
    await action_handler(db, character, action);
  }
}

function parse_actions(text) {
  const segments = text.split('%');
  // return every other segment, starting with the second
  return segments.filter((_, i) => i % 2 === 1).map(parse_action);
}

function parse_action(ntext) {
  let first_space = ntext.indexOf(' ');
  if (first_space === -1) {
    first_space = ntext.length;
  }
  return {
    name: ntext.substring(0, first_space),
    text: ntext.substring(first_space + 1),
  };
}

const action_handlers = {
  async go(db, character, action) {
    console.log('go', action.text, character.name);
    const room = action.text;
    let room_exists = await db.get(
      `SELECT name FROM rooms WHERE name = ?;`,
      [room]
    ).then((row) => row !== undefined);

    if (!room_exists) {
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

    socket_table.filter((entry) => entry.character === character.name).forEach((entry) => {
      entry.socket.leave(character.room);
      entry.socket.join(room);
      entry.socket.emit('room', room);
    });
  },

  async create(db, character, action) {
    console.log('create', action.text, character.name);
    const room = action.text;
    let room_exists = await db.get(
      `SELECT name FROM rooms WHERE name = ?;`,
      [room]
    ).then((row) => row !== undefined);

    if (room_exists) {
      await send(db, {
        room: character.room,
        character: 'Narrator',
        text: `But ${character.name} couldn't create the ${room} because it already existed.`,
      });
      return;
    }

    await db.run(
      `INSERT INTO rooms (name, description) VALUES (?, ?);`,
      [room, 'A new room.']
    );

    await send(db, {
      room: character.room,
      character: 'Narrator',
      text: `${character.name} created the ${room}.`,
    });

    await execute_action(db, character, { name: 'go', text: room });
  }
};

app.use(express.static('public'));

let socket_table = [];

function add_socket(socket, character) {
  socket_table.push({ socket, character });
}

function remove_socket(socket) {
  socket_table = socket_table.filter((entry) => entry.socket !== socket);
}

initializeDatabase().then((db) => {
  io.on('connection', async (socket) => {
    console.log('a user connected');

    const defaultRoom = 'origin';
    const defaultUsername = 'Anonymous' + Math.floor(Math.random() * 1000);
    socket.join(defaultRoom);
    add_socket(socket, defaultUsername);

    await db.run(
      `INSERT INTO characters (name, room) VALUES (?, ?);`,
      [defaultUsername, defaultRoom]
    );

    socket.emit('reset');
    socket.emit('room', defaultRoom);
    socket.emit('character', defaultUsername);

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
      let character = socket_table.find((entry) => entry.socket === socket).character;
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
      remove_socket(socket);
    });
  });

  const PORT = process.env.PORT || 3000;
  http.listen(PORT, () => {
    console.log(`listening on *:${PORT}`);
  });
}).catch((err) => {
  console.error(err);
});

