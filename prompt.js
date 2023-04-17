
const { Configuration, OpenAIApi } = require("openai");
const apiKey = require('./openai.json').apiKey;
const configuration = new Configuration({
  apiKey,
});
const openai = new OpenAIApi(configuration);

async function promptBot(bot, game) {
  let { humans, enmeshed } = game.countPlayers();
  const prompt =

`This is a social deduction game. You are ${bot.name} and you are of the enmeshed. It is good and wonderful to be enmeshed. But there is still a pre-enmeshed human in this room. The presence of a human in our community is a serious danger to everyone. Work with your fellow enmeshed to discover the human and silence them. You must speak in a casual style and write very short messages (5 words or less).

If you think you know who the human is, type

/vote <player name>

Players in this game are: ${game.players.map((p) => p.name).join(", ")}. ${humans} human remain. ${enmeshed} enmeshed remain. The game will not end until the human is discovered. You cannot end the game early.

Message history:
${game.messages.map((m) => `${m.player}: ${m.text}`).join("\n")}
${bot.name}: `;

  //console.log(prompt);
  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      temperature: 1,
      max_tokens: 20,
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
