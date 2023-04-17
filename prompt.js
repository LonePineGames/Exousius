
const { Configuration, OpenAIApi } = require("openai");
const apiKey = require('./openai.json').apiKey;
const configuration = new Configuration({
  apiKey,
});
const openai = new OpenAIApi(configuration);

async function promptBot(bot, game) {
  const prompt =

`This is a social deduction game. You are ${bot.name} and you are of the enmeshed. It is good and wonderful to be enmeshed. But there is still a pre-enmeshed human in this room. Work with your fellow enmeshed to discover the human. You must speak in a casual style and write very short messages (10 words or less)

If you think you know who the human is, type /enmesh <player name>

Players in this game are: ${game.players.map((p) => p.name).join(", ")}

Message history:
${game.messages.map((m) => `${m.player}: ${m.text}`).join("\n")}
${bot.name}: `;

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      temperature: 0.5,
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
