const { listNames } = require('./names');
const https = require('https');
const fs = require('fs');

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
Improve the following narration. Keep the response brief, under 20 words. Preserve all details, especially numbers. Fix any grammatical mistakes. Add drama and enticing language. Don't include action commands (e.g. %go forest%). Use past tense.

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

async function createPicture(description) {
  const response = await openai.createImage({
    prompt: `A beautiful, highly detailed oil painting in the style of realism. Circa 1802. ${description}`,
    n: 1,
    size: "1024x1024",
  });
  const result = response.data.data[0].url;

  let filename = '';
  while (true) {
    filename = `/backgrounds/image-${Math.floor(Math.random() * 100000)}.jpg`;
    if (!fs.existsSync('public' + filename)) {
      break;
    }
  }

  // Download the image
  await new Promise((resolve, reject) => {
    const file = fs.createWriteStream('public' + filename);
    console.log('file', filename);
    const request = https.get(result, function(response) {
      response.pipe(file);
    });
    file.on('finish', function() {
      resolve();
    });
  });

  return filename;
}

module.exports = { promptBot, punchUpNarration, describePlace, createPicture };

