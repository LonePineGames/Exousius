const { NameServer } = require('./names');
const { promptBot, personalities } = require('./prompt');

class Player {
  constructor(role, force, name) {
    this.role = role;
    this.force = force;
    this.name = name;
    this.votes = [];
    this.silenced = false;
    this.personality = personalities[Math.floor(Math.random() * personalities.length)];
  }
}

class Game {
  constructor() {
    this.currentPromptLoop = null;
    this.messageHandlers = [];
    this.rate = 10000;
    this.reset();
  }

  kill() {
    if (this.currentPromptLoop) {
      clearInterval(this.currentPromptLoop);
    }
    this.currentPromptLoop = null;
  }

  reset() {
    if (this.currentPromptLoop) {
      clearInterval(this.currentPromptLoop);
    }
    this.currentPromptLoop = null;

    this.players = [];
    this.messages = [];
    this.ended = false;
    this.messagesSinceVote = 0;
    this.nextSpeaker = '';
    this.nameserver = new NameServer();

    let numEnmeshed = 3 + Math.floor(Math.random() * 3);
    //if (numEnmeshed > 4) {
      //this.addPlayer('bot', 'human');
    //}
    for (let i = 0; i < numEnmeshed; i++) {
      this.addPlayer('bot', 'enmeshed');
    }
  }

  setRate(rate) {
    this.rate = rate;
    this.promptLoop();
    console.log("RATE", rate);
  }

  promptLoop() {
    if (this.currentPromptLoop) {
      clearInterval(this.currentPromptLoop);
    }
    if (this.rate <= 10) {
      return;
    }
    this.currentPromptLoop = setInterval(async () => {
      if (!this.humansPresent()) {
        return;
      }
      if (this.ended && this.messagesSinceVote > 15) {
        this.send({player: "System", text: 'The game has ended. You can start a new game by clicking reset.'});
        this.kill();
        return;
      }

      let bot = null;
      for (let i = this.messages.length - 1; i >= 0; i--) {
        const message = this.messages[i];
        const words = message.text.split(' ');
        for (const word of words) {
          const playerName = word.replace(/[^a-zA-Z]/g, '');
          bot = this.players.find(player => player.name === playerName);
          if (bot) {
            break;
          }
        }
        if (bot) {
          break;
        }
      }

      let good = bot && bot.role === 'bot' && (!bot.silenced || this.ended);
      if (!good || Math.random() < 0.5) {
        const botIndex = Math.floor(Math.random() * this.players.length);
        bot = this.players[botIndex];
      }

      const nextSpeaker = this.players.find(player => player.name === this.nextSpeaker);
      if (nextSpeaker && Math.random() < 0.5 && nextSpeaker.role === 'bot' && (!nextSpeaker.silenced || this.ended)) {
        bot = nextSpeaker;
      }

      if (bot.role === 'bot' && (!bot.silenced || this.ended)) {
        if (!this.ended && this.messagesSinceVote > 10) {
          let players = this.players.filter(player => !player.silenced);
          let player = players[Math.floor(Math.random() * players.length)];
          this.send({player: bot.name, text: '/vote ' + player.name});
        }
        const response = await promptBot(bot, this);
        if (response.length > 0) {
          this.send({player: bot.name, text: response});
        }
      }
    }, this.rate);
  }

  addPlayer(role, force) {
    //if (role === 'human') return 'Human';
    const player = new Player(role, force, this.nameserver.getUnusedName());
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
    if (message.text.startsWith('/end')) {
      return;
    }
    //console.log("SEND", message);
    this.messages.push(message);
    this.messageHandlers.forEach(handler => handler(message));
    this.handleVote(message);
  }

  onMessage(handler) {
    this.messages.forEach(handler);
    this.messageHandlers.push(handler);
  }

  humansPresent() {
    return true; //this.players.some(player => player.role === 'human');
  }

  handleVote(message) {
    if (this.ended) {
      this.messagesSinceVote++;
      return;
    }

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
        const {majority, total} = this.countPlayers();
        this.messagesSinceVote = 0;
        if (player.votes.length < majority) {
          this.send({player: "System", text: `${message.player} voted to silence ${player.name}. ${player.votes.length} out of ${majority} votes needed to silence ${player.name}. There are ${total} players remaining.`});
        } else {
          this.send({player: "System", text: `${message.player} voted to silence ${player.name}. ${player.name} has ${player.votes.length} votes.`});
          this.checkSilencePlayer(player);
        }
      } else {
        // log a stack trace
        console.trace();
        this.send({player: "System", text: `${playerName} is not a valid player.`});
      }
    } else {
      this.messagesSinceVote++;
    }
  }

  checkSilencePlayer(player) {
    let {majority} = this.countPlayers();
    if (player.votes.length >= majority) {
      player.silenced = true;
      this.send({player: "System", text: `${player.name} is now silenced and cannot speak. ${player.name} was ${player.force}.`});

      if (majority <= 2) {
        this.send({player: "System", text: `Votes have been reset.`});
        for (const index in this.players) {
          const player = this.players[index];
          player.votes = [];
        }
      }

      this.checkWin();
      if (!this.ended) {
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

      if (player.force === 'human') {
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

    if (this.ended) {
      let humans = this.players.filter(player => player.force === 'human');
      if (humans.length === 1) {
        this.send({player: "System", text: `The human was ${humans[0].name}.`});
      } else {
        this.send({player: "System", text: `The humans were ${humans.map(player => player.name).join(', ')}.`});
      }

      this.send({player: "System", text: 'PROMOSURVEY'});
      // Did "Enmeshed" change the way you feel about AI? Please answer this single question anonymous survery: https://forms.gle/knteLs8qrNTf5N9L7"});
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

