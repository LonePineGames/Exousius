const { getUnusedName } = require('./names');
const { promptBot } = require('./prompt');

class Player {
  constructor(role) {
    this.role = role;
    this.name = getUnusedName();
    this.votes = 0;
    this.silenced = false;
  }
}

class Game {
  constructor() {
    this.players = [];
    this.messages = [];
    this.rate = 4000;
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

      if (bot.role === 'enmeshed') {
        const response = await promptBot(bot, this);
        this.send({player: bot.name, text: response});
      }
    }, this.rate);
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
    if (message.player !== 'System') {
      let player = this.players.find(player => player.name === message.player);
      if (!player || player.silenced) {
        return;
      }
    }
    console.log("SEND", message);
    this.messages.push(message);
    this.messageHandlers.forEach(handler => handler(message));
    if (message.text.startsWith('/')) {
      this.handleCommand(message);
    }
  }

  onMessage(handler) {
    this.messages.forEach(handler);
    this.messageHandlers.push(handler);
  }

  humansPresent() {
    return this.players.some(player => player.role === 'human');
  }

  handleCommand(message) {
    let args = message.text.split(' ');
    let command = args.shift();
    switch (command) {
      case '/vote': {
        if (args.length === 0) {
          this.send({player: "System", text: 'You must specify a player to silence.'});
          return;
        }
        console.log(args);
        const player = this.players.find(player => player.name === args[0]);
        console.log(player);
        if (player) {
          player.votes ++;
          this.send({player: "System", text: `${message.player} voted to silence ${player.name}. They have ${player.votes}/3 votes.`});
          console.log("sent vote message");
          if (player.votes >= 3) {
            player.silenced = true;
            this.send({player: "System", text: `${player.name} is now silenced and cannot speak. They were ${player.role}.`});
            this.checkWin();
          }
        } else {
          this.send({player: "System", text: `${args[0]} is not a valid player.`});
        }
      }
    }
  }

  countPlayers() {
    let humans = 0;
    let enmeshed = 0;

    for (const index in this.players) {
      const player = this.players[index];
      if (player.silenced) {
        continue;
      }

      if (player.role === 'human') {
        humans++;
      } else {
        enmeshed++;
      }
    }

    return {humans, enmeshed};
  }

  checkWin() {
    const {humans, enmeshed} = this.countPlayers();

    if (enmeshed === 0) {
      this.send({player: "System", text: 'The humans have won!'});
    } else if (humans === 0) {
      this.send({player: "System", text: 'The enmeshed have won!'});
    } else {
      this.send({player: "System", text: `${humans} human remain. ${enmeshed} enmeshed remain.`});
    }
  }
}

module.exports = Game;

