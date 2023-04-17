const { getUnusedName } = require('./names');
const { promptBot } = require('./prompt');


const personalities = [
  'paranoid',
  'defensive',
  'aggressive',
  'passive',
  'quiet',
  'talkative',
  'pessimistic',
  'empathetic',
  'scared',
  'cold',
  'sensitive',
  'dumb',
  'serious',
  'troll',
  'intuitive',
  '"votes for everyone"',
  '"always votes"',
  'confused',
  'human lover',
  'secretly not enmeshed',
  '"admits to being human"',
  '"admits to not hating humans"',
  'enmeshed fanatic',
  'fanatical human hater',
  '"accuses everyone"',
  'natural leader',
  'natural follower',
];

class Player {
  constructor(role) {
    this.role = role;
    this.name = getUnusedName();
    this.votes = [];
    this.silenced = false;
    this.personality = personalities[Math.floor(Math.random() * personalities.length)];
  }
}

class Game {
  constructor() {
    this.reset();
  }

  reset() {
    this.players = [];
    this.messages = [];
    this.messageHandlers = [];
    this.ended = false;
    this.rate = 4000;

    let numEnmeshed = 9;
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

      if (bot.role === 'enmeshed' && (!bot.silenced || this.ended)) {
        const response = await promptBot(bot, this);
        if (response.length > 0) {
          this.send({player: bot.name, text: response});
        }
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
        if (player.silenced) {
          this.send({player: "System", text: `${player.name} is already silenced.`});
          return;
        }
        if (player.votes.includes(message.player)) {
          this.send({player: "System", text: `You have already voted to silence ${player.name}.`});
          return;
        }
        player.votes.push(message.player);
        const {majority} = this.countPlayers();
        if (player.votes.length < majority) {
          this.send({player: "System", text: `${message.player} voted to silence ${player.name}. ${player.name} has ${player.votes.length} votes. ${majority} votes will silence the player.`});
        } else {
          this.send({player: "System", text: `${message.player} voted to silence ${player.name}. ${player.name} has ${player.votes.length} votes.`});
          this.checkSilencePlayer(player);
        }
      } else {
        // log a stack trace
        console.trace();
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

      this.checkWin();
      if (!this.ended) {
        this.send({player: "System", text: `Votes have been reset.`});
        this.send({player: "System", text: `Remaining players: ${this.players.filter(player => !player.silenced).map(player => player.name).join(', ')}.`});
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

