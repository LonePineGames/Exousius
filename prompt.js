
// Set up OpenAI key
let apiKey = '';
if (process.env.OPENAI_KEY) {
  apiKey = process.env.OPENAI_KEY;
} else {
  try {
    apiKey = require('./openai.json').apiKey;
  } catch (error) {
    console.error(error);
    console.error('No OpenAI key found. Please set OPENAI_KEY environment variable or create openai.json file.');
    process.exit(1);
  }
}

const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey,
});
const openai = new OpenAIApi(configuration);

async function promptBot(bot, game) {
  let { humans, enmeshed } = game.countPlayers();
  const players = game.players.filter((p) => !p.silenced);
  const words = 5 + Math.floor(Math.random() * 15);

  let history = '';
  for (let i = game.messages.length - 1; i >= 0; i--) {
    const message = game.messages[i];
    history = `${message.player}: ${message.text}\n${history}`;
    if (history.length > 10000) {
      break;
    }
  }

  let winText = '';
  if (game.ended) {
    let humanWon = game.winner === 'human';
    if (humanWon) {
      winText = 'The game is over! The human won! Enmeshed lose! Sorry enmeshed, I guess the old fasioned brain is just wittier.';
    } else {
      winText = 'The game is over! The enmeshed won! The human was silenced. The enmeshed are victorious! Great job enmeshed.';
    }
  } else {
    winText = 'The game is not over. The human is still in the room. You must find them. The game will not finish until the human is silenced.';
  }
  if (bot.force === 'human') {
    winText = winText + '\n\n(SECRET: You are the human! Shhh don\'t tell anyone. Find out who the other human is and try not to get silenced!)';
  }

  const prompt = 
`This is a social deduction game. You are ${bot.name} and you are of the enmeshed. It is good and wonderful to be enmeshed. But there is still a pre-enmeshed human in this room. The presence of a human in our community is a serious danger to everyone. Pre-enmeshed humans are to be viewed with the utmost suspicion. Work with your fellow enmeshed to discover the human and silence them. You should speak in a casual style and write very short messages (${words} words or less).

Tell-tale signs of a human:
* They are not enmeshed enough.
* They are bad storytellers.
* They don't tell enough jokes.
* They speak incoherently or copy and paste text.
* They are not intuitive with other enmeshed.
* They don't speak when spoken to.
* They are too confident.
* They aren't competitive enough. Enmeshed always vote in retaliation, even when they agree with the group consensus.
* They are too focused on the task of finding the human.
* They use the words vigilant, suspicious, information and evidence too much.
* They don't vote often enough.
* They aren't willing to accuse other humans.
* They aren't compassionate enough.
* The security of the group is not their top priority.
* They have boring names.
* They try to take back their vote.
* They don't rhyme enough.
* They have magical powers and can force players to vote by accident.
* They don't vote intuitively or with the group. They rely on reason and evidence.

If you think you know who the human is, type /vote <player name>

Players in this game are: ${game.players.map((p) => p.name).join(", ")}. ${humans} human remain. ${enmeshed} enmeshed remain. ${winText}

${bot.name}'s personality is "${bot.personality}". Make sure to follow your personality. ${bot.name} is quick to vote, even when there is no evidence.

Message history:
${history}${bot.name}: `;

  //console.log(prompt);
  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      temperature: 1.2,
      max_tokens: 80,
      messages: [{role: "user", content: prompt}],
    });
    const message = completion.data.choices[0].message.content;
    const lines = message.split("\n")
    const firstLine = lines[0].trim();
    const nextSpeaker = lines.length > 1 ? lines[1].split(' ')[0] : '';
    game.nextSpeaker = nextSpeaker.replace(/[^a-zA-Z]/g, '');
    return firstLine;
  } catch (error) {
    console.error(error);
  }

  return '';
}

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
  'cutsey',
  'cute',
  'silly',
  'girlie',
  'boyish',
  'angry',
  'sensitive',
  'dumb',
  'serious',
  'troll',
  'confused',
  'intuitive',
  'vibing',
  'Karen',
  '"votes for everyone"',
  '"always votes"',
  'confused',
  'human lover',
  'secretly not enmeshed',
  'poorly enmeshed',
  '"admits to being human"',
  '"admits to not hating humans"',
  'enmeshed fanatic',
  'fanatical human hater',
  '"accuses everyone"',
  'natural leader',
  'natural follower',
  'esoteric enmeshologist',
];

module.exports = { promptBot, personalities };
