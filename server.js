const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const Game = require('./game');

app.use(express.static('public'));

const game = new Game();
game.promptLoop();

io.on('connection', (socket) => {
  console.log('socket connect');
  let player = game.addPlayer("human");
  game.onMessage((message) => {
    console.log('game message', message);
    socket.emit('message', message);
  });

  socket.on('message', (message) => {
    console.log('socket message', message);
    message.player = player;
    game.send(message);
  });

  socket.on('disconnect', () => {
    console.log('socket disconnect');
    game.removePlayer(player);
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

