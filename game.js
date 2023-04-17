const { getUnusedName } = require('./names');
const { promptBot } = require('./prompt');

class Player {
  constructor(role) {
    this.role = role;
    this.name = getUnusedName();
  }
}

class Game {
  constructor() {
    this.players = [];
    this.messages = [];
    this.rate = 10000;
    this.messageHandlers = [];

    let numEnmeshed = 4;
    for (let i = 0; i < numEnmeshed; i++) {
      this.addPlayer('enmeshed');
    }
  }

  promptLoop() {
    setInterval(async () => {
      if (!this.humansPresent()) {
        return;
      }

      const botIndex = Math.floor(Math.random() * this.players.length);
      const bot = this.players[botIndex];

      if (bot.role !== 'human') {
        const response = await promptBot(bot, this);
        this.send({player: bot.name, text: response});
      }
    }, 10000);
  }

  addPlayer(role) {
    const player = new Player(role);
    this.players.push(player);
    return player.name;
  }

  removePlayer(name) {
    this.players = this.players.filter(player => player.name !== name);
  }

  send(message) {
    console.log("SEND", message);
    this.messages.push(message);
    this.messageHandlers.forEach(handler => handler(message));
  }

  onMessage(handler) {
    this.messages.forEach(handler);
    this.messageHandlers.push(handler);
  }

  humansPresent() {
    return this.players.some(player => player.role === 'human');
  }
}

module.exports = Game;

