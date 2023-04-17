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
  socket.emit('message', { player: "System", text: `Your name is ${player}.` });

  game.onMessage((message) => {
    socket.emit('message', message);
  });

  socket.on('message', (message) => {
    message.player = player;
    game.send(message);
  });

  socket.on('disconnect', () => {
    console.log('socket disconnect');
    game.removePlayer(player);
  });

  socket.on('reset', () => {
    console.log('reset');
    game.reset();
    player = game.addPlayer("human");
    socket.emit('message', { player: "System", text: `Your name is ${player}.` });
    socket.emit('message', { player: "System", text: `Current players are ${game.players.join(', ')}.`});
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

