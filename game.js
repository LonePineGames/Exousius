const { getUnusedName } = require('./names');

class Player {
  constructor(role) {
    this.role = role;
    this.name = getUnusedName();
  }
}

class Game {
  constructor() {
    this.players = [];
    this.history = [];
    this.messageHandlers = [];
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
    this.history.push(message);
    this.messageHandlers.forEach(handler => handler(message));
  }

  onMessage(handler) {
    this.history.forEach(handler);
    this.messageHandlers.push(handler);
  }
}

module.exports = Game;

