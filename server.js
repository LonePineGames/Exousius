const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const sqlite3 = require('sqlite3').verbose();
const dbFile = './chatroom.db';

app.use(express.static('public'));

// Initialize SQLite database
const db = new sqlite3.Database(dbFile, (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log('Connected to the SQLite database.');
    db.run(
      `CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room TEXT NOT NULL,
        character TEXT NOT NULL,
        text TEXT NOT NULL,
        timestamp TEXT NOT NULL
      );`,
      (err) => {
        if (err) {
          console.error(err.message);
        } else {
          console.log('Table created or already exists.');
        }
      }
    );
  }
});

function send(message) {
  const messageData = {
    timestamp: new Date().toISOString(),
    ...message,
  };

  console.log(messageData);

  // Insert the message into the database
  db.run(
    `INSERT INTO messages (room, character, text, timestamp) VALUES (?, ?, ?, ?);`,
    [messageData.room, messageData.character, messageData.text, messageData.timestamp],
    (err) => {
      if (err) {
        console.error(err.message);
      } else {
        console.log('Message inserted into the database.');

        // Emit the message to all clients in the room
        io.to(message.room).emit('message', messageData);
      }
    }
  );
}

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('a user connected');

  // Assign the user to the default room
  const defaultRoom = 'general';
  const defaultUsername = 'Anonymous';
  socket.join(defaultRoom);

  socket.emit('reset');
  socket.emit('room', defaultRoom);
  socket.emit('character', defaultUsername);

  // Get the last ~10 messages from the database and emit them
  db.all(
    `SELECT * FROM messages WHERE room = ? ORDER BY timestamp DESC LIMIT 10;`,
    [defaultRoom],
    (err, rows) => {
      if (err) {
        console.error(err.message);
      } else {
        socket.emit('previous messages', rows.reverse());
      }
    }
  );

  // Listen for new messages
  socket.on('message', (msg) => {
    const messageData = {
      room: defaultRoom,
      character: defaultUsername,
      ...msg,
    };

    send(messageData);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`listening on *:${PORT}`);
});

