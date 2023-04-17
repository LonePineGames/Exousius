const { getUnusedName } = require('./names');
const { promptBot } = require('./prompt');

class Player {
  constructor(role) {
    this.role = role;
    this.name = getUnusedName();
    this.votes = [];
    this.silenced = false;
  }
}

class Game {
  constructor() {
    this.players = [];
    this.messages = [];
    this.rate = 4000;
    this.messageHandlers = [];
    this.ended = false;

    let numEnmeshed = 5;
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

      if (bot.role === 'enmeshed' && !bot.silenced) {
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
    if (message.player !== 'System' && !this.ended) {
      let player = this.players.find(player => player.name === message.player);
      if (!player || player.silenced) {
        return;
      }
    }
    console.log("SEND", message);
    this.messages.push(message);
    this.messageHandlers.forEach(handler => handler(message));
    this.handleVote(message);
  }

  onMessage(handler) {
    this.messages.forEach(handler);
    this.messageHandlers.push(handler);
  }

  humansPresent() {
    return this.players.some(player => player.role === 'human');
  }

  handleVote(message) {
    let vote = extractVote(message.text);
    if (vote) {
      const playerName = vote.replace(/[^a-zA-Z]/g, '');
      const player = this.players.find(player => player.name === playerName);
      if (player) {
        if (player.votes.includes(message.player)) {
          this.send({player: "System", text: `You have already voted to silence ${player.name}.`});
          return;
        }
        player.votes.push(message.player);
        const {majority} = this.countPlayers();
        this.send({player: "System", text: `${message.player} voted to silence ${player.name}. They have ${player.votes.length}/${majority} votes.`});
        this.checkSilencePlayer(player);
      } else {
        this.send({player: "System", text: `${playerName} is not a valid player.`});
      }
    }
  }

  checkSilencePlayer(player) {
    let {majority} = this.countPlayers();
    if (player.votes.length >= majority) {
      player.silenced = true;
      this.send({player: "System", text: `${player.name} is now silenced and cannot speak. They were ${player.role}.`});

      for (const index in this.players) {
        const player = this.players[index];
        player.votes = [];
      }
      this.send({player: "System", text: `Votes have been reset.`});

      this.checkWin();
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
    let total = humans + enmeshed;
    let majority = Math.ceil(total / 2);

    return {humans, enmeshed, total, majority};
  }

  checkWin() {
    const {humans, enmeshed} = this.countPlayers();

    if (enmeshed === 0) {
      this.send({player: "System", text: 'The humans have won!'});
      this.ended = true;
    } else if (humans === 0) {
      this.send({player: "System", text: 'The enmeshed have won!'});
      this.ended = true;
    } else {
      this.send({player: "System", text: `${humans} human remain. ${enmeshed} enmeshed remain.`});
    }
  }
}

function extractVote(message) {
  const voteIndex = message.indexOf("/vote");
  if (voteIndex !== -1) {
    const spaceIndex = message.indexOf(" ", voteIndex + 6);
    if (spaceIndex !== -1) {
      return message.substring(voteIndex + 6, spaceIndex);
    }
    return message.substring(voteIndex + 6);
  }
  return null;
}

module.exports = Game;

