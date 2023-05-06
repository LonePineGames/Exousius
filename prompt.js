const { listNames } = require('./names');

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

async function promptBot(character, suggestions, inRoom, history) {
  console.log('promptBot', character, inRoom);
  let inRoomText = listNames(inRoom.map((p) => p.name));
  const prompt = 

`This is a text-based role playing game set in a medieval fantasy world. I am ${character.name}, a demon summoned by ${character.summoner}.

${character.script}

### Suggested Actions
${suggestions.join('\n')}

### History
${history.map((h) => `${h.character}: ${h.text}`).join('\n')}

### Context
I am in the ${character.room}. Creatures in the ${character.room}: ${inRoomText}. I have ${character.hp}/10 HP and I am carrying ${character.shards} shards.

### Instructions
Output only ${character.name}'s response. Keep the response brief, under 20 words. If ${character.name} remains silent, output an empty string. If ${character.name} does an action, output one of the suggested actions as part of the response. Example:
${character.name}: Master, I must go! %go forest%

### Response
${character.name}: `;

  console.log(prompt);

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      temperature: 1.2,
      max_tokens: 80,
      messages: [{role: "user", content: prompt}],
    });
    const message = completion.data.choices[0].message.content;
    console.log('message', message);
    const lines = message.split("\n")
    const firstLine = lines[0].trim();
    return firstLine;
  } catch (error) {
    console.error(error);
  }

  return '';
}

async function punchUpNarration(narration, history, room, inRoom) {
  console.log('punchUpNarration', narration, room, inRoom);
  let inRoomText = listNames(inRoom.map((p) => p.name));
  const prompt =
`This is a text-based role playing game set in a medieval fantasy world. I am the narrator.

### History
${history.map((h) => `${h.character}: ${h.text}`).join('\n')}

### Context
${room.description} Creatures in the ${room.name}: ${inRoomText}.

### Instructions
Improve the following narration. Keep the response brief, under 20 words. Preserve all details, especially numbers. Fix any grammatical mistakes. Add drama and enticing language.

Narrator: ${narration}

### Response
Narrator: `;
  console.log(prompt);

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      temperature: 1.2,
      max_tokens: 80,
      messages: [{role: "user", content: prompt}],
    });
    const message = completion.data.choices[0].message.content;
    console.log('message', message);
    const lines = message.split("\n")
    const firstLine = lines[0].trim();
    return firstLine;
  } catch (error) {
    console.error(error);
  }

  return '';
}

async function describePlace(character, history, roomName) {
  console.log('describePlace', roomName);
  let prompt =
`This is a text-based role playing game set in a medieval fantasy world.

### History
${history.map((h) => `${h.character}: ${h.text}`).join('\n')}

### Instructions
Describe the ${roomName}, which ${character.name} just created. Keep the response brief, under 20 words. Add drama and enticing language. Use past tense. Only describe the ${roomName}. Do not describe ${character.name} or any other characters.

### Example
The tavern was a warm and inviting space, with a roaring fire and lively chatter.

### Response
`;

  console.log(prompt);

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      temperature: 1.2,
      max_tokens: 80,
      messages: [{role: "user", content: prompt}],
    });
    const message = completion.data.choices[0].message.content;
    console.log('message', message);
    const lines = message.split("\n")
    const firstLine = lines[0].trim();
    return firstLine;
  } catch (error) {
    console.error(error);
  }

  return '';
}

module.exports = { promptBot, punchUpNarration, describePlace };

