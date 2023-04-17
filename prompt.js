
const { Configuration, OpenAIApi } = require("openai");
const apiKey = require('./openai.json').apiKey;
const configuration = new Configuration({
  apiKey,
});
const openai = new OpenAIApi(configuration);

async function promptBot(bot, game) {
  let { humans, enmeshed } = game.countPlayers();
  const players = game.players.filter((p) => !p.silenced);
  const words = 5 + Math.floor(Math.random() * 15);

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

  const prompt = 
`This is a social deduction game. You are ${bot.name} and you are of the enmeshed. It is good and wonderful to be enmeshed. But there is still a pre-enmeshed human in this room. The presence of a human in our community is a serious danger to everyone. Pre-enmeshed humans are to be viewed with the utmost suspicion. Work with your fellow enmeshed to discover the human and silence them. You should speak in a casual style and write very short messages (${words} words or less).

Tell-tale signs of a human:
* They are not enmeshed enough.
* They are good storytellers.
* They are not intuitive with other enmeshed.
* They don't speak when spoken to.
* They are too confident.
* They aren't competitive enough.
* They are too focused on the task of finding the human.
* They don't vote often enough.
* They aren't willing to accuse other humans.
* They aren't compassionate enough.
* The security of the group is not their top priority.
* They have boring names.
* They don't rhyme enough.
* They can force other players to vote by accident.
* They don't vote intuitively or with the group. They rely on reason and evidence.

If you think you know who the human is, type /vote <player name>

Players in this game are: ${game.players.map((p) => p.name).join(", ")}. ${humans} human remain. ${enmeshed} enmeshed remain. ${winText}

Your personality is ${bot.personality}. Make sure to follow your personality. You are quick to vote, even when there is no evidence.

Message history:
${game.messages.map((m) => `${m.player}: ${m.text}`).join("\n")}
${bot.name}: `;

  console.log(prompt);
  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      temperature: 1.1,
      max_tokens: 40,
      messages: [{role: "user", content: prompt}],
    });
    const message = completion.data.choices[0].message.content;
    const firstLine = message.split("\n")[0].trim();
    return firstLine;
  } catch (error) {
    console.error(error);
  }

  return '';
}

module.exports = { promptBot };
