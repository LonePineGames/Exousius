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

  try {
    await db.run(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room TEXT NOT NULL,
        character TEXT NOT NULL,
        text TEXT NOT NULL,
        timestamp TEXT NOT NULL
      );
    `);

    console.log('Table created or already exists.');

    return db;
  } catch (err) {
    console.error(err.message);
    throw err;
  }
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
  } catch (err) {
    console.error(err.message);
  }
}

app.use(express.static('public'));

initializeDatabase().then((db) => {
  io.on('connection', async (socket) => {
    console.log('a user connected');

    const defaultRoom = 'general';
    const defaultUsername = 'Anonymous';
    socket.join(defaultRoom);

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

    socket.on('message', (msg) => {
      const messageData = {
        room: defaultRoom,
        character: defaultUsername,
        ...msg,
      };

      send(db, messageData);
    });

    socket.on('disconnect', () => {
      console.log('user disconnected');
    });
  });

  const PORT = process.env.PORT || 3000;
  http.listen(PORT, () => {
    console.log(`listening on *:${PORT}`);
  });
}).catch((err) => {
  console.error(err);
});

