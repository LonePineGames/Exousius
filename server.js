const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const Game = require('./game');
const { listNames } = require('./names');

/*
app.use((req, res, next) => {
  if (!req.get('Host').startsWith('localhost') && req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(['https://', req.get('Host'), req.url].join(''));
  }
  next();
});
*/

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('socket connect');

  const game = new Game();

  let player = null;

  function reset() {
    console.log('reset');
    socket.emit('reset');
    game.reset();
    game.promptLoop();
    player = game.addPlayer("human", "human");
    let players = listNames(game.players.map((player) => player.name));
    socket.emit('set-name', player);
    socket.emit('message', { player: "System", text: `Your name is ${player}. Current players are ${players}.`});
  }

  game.onMessage((message) => {
    console.log(`${message.player}: ${message.text}`);
    socket.emit('message', message);
  });

  socket.on('message', (message) => {
    message.player = player;
    console.log('(human)');
    game.send(message);
  });

  socket.on('set-rate', (rate) => {
    game.setRate(rate);
  });

  socket.on('disconnect', () => {
    console.log('socket disconnect');
    game.removePlayer(player);
    game.kill();
    console.log('game killed');
  });

  socket.on('reset', () => {
    reset();
  });

  reset();
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

