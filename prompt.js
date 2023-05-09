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

const pronounHint = `### Pronoun Hint
he/him/his/his/himself
she/her/her/hers/herself
they/them/their/theirs/themselves
it/it/its/its/itself
fae/faem/fae/faes/faeself
I/me/my/mine/myself
you/you/your/yours/yourself
we/us/our/ours/ourselves

Be attentive to pronouns. Example: Fae healed feaself for 2HP. Fae gave you 5 shards. We attacked faem for 5 HP damage.`;

async function promptBot(character, suggestions, inRoom, history) {
  //console.log('promptBot', character, inRoom);
  let inRoomText = listNames(inRoom.map((p) => p.name));
  let summonText = character.summoner === 'Narrator' ? '' : ` I was summoned by ${character.summoner}.`;
  let maxHP = character.role === 'mob' ? '' : ` out of 10`;
  const prompt =

`This is a text-based role playing game set in a medieval fantasy world. I am ${character.name}.${summonText}

${character.script}

### Suggested Actions
${suggestions.join('\n')}

### History
${history.map((h) => `${h.character}: ${h.text}`).join('\n')}

### Context
I am in the ${character.room}. Creatures in the ${character.room}: ${inRoomText}. I have ${character.hp}${maxHP} HP and I am carrying ${character.shards} shards.

### Instructions
Output only ${character.name}'s response. Keep the response brief, under 20 words. If ${character.name} does an action, output one of the suggested actions as part of the response. Example:
${character.name}: I must go! %go forest%

### Response
${character.name}: `;

  //console.log(prompt);

  try {
    const completion = await openai.createChatCompletion({
      model: character.role === 'mob' ? "gpt-3.5-turbo" : "gpt-4",
      temperature: 1.2,
      max_tokens: 80,
      messages: [{role: "user", content: prompt}],
    });
    const message = completion.data.choices[0].message.content;
    //console.log('message', message);
    const lines = message.split("\n")
    const firstLine = lines[0].trim();
    return firstLine;
  } catch (error) {
    console.error(error);
  }

  return '';
}

async function punchUpNarration(narration, history, room, inRoom) {
  //console.log('punchUpNarration', narration, room, inRoom);
  let inRoomText = listNames(inRoom.map((p) => p.name));
  let descriptions = inRoom.filter((p) => p.role !== 'mob')
    .map((p) => {
      if (p.title === '') {
        return `${p.name}: ${p.description}`;
      } else {
        return `${p.name} (Pronoun: ${p.title.toLowerCase()}): ${p.description}`;
      }
    }).join('\n');

  const prompt =
`This is a text-based role playing game set in a medieval fantasy world. I am the narrator.

### Context
${room.description} Creatures currently in the ${room.name}: ${inRoomText}. Only these ceatures are here.

${descriptions}

${pronounHint}

### Instructions
Improve the following narration. Keep the response brief, under 20 words. Preserve all details, especially numbers. Fix any grammatical mistakes, capitalization and pluralization issues, and so on. Add drama and enticing language. Don't include action commands (e.g. %go forest%). Only describe the events mentioned in the original narration. Use past tense. Connect the narration to the history and context. Make it sound like an old fairy tale.

### Example
Original: Arkim healed Arkim for 2HP. Arkim searched the origin and found a shard. Arkim searched the origin for shards. Arkim found some useful items, but no shards. rowdy bard struck Arkim.
Response: After the battle, Arkim healed himself for 2HP. Then he turned to his most important task: the search for shards. For hours, he searched the dark void, fruitlessly... Until, finally, he found a shard! His spirits raised, he continued his search. But a second shard would be elusive, as Arkim's fervent search only yielded an old pickaxe. Rowdy bard suddenly attacked.

### History
${history.map((h) => `${h.character}: ${h.text}`).join('\n')}

### Original Narration
Narrator: ${narration}

### Response
Narrator: `;
  //console.log(prompt);

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      temperature: 1.2,
      max_tokens: 200,
      messages: [{role: "user", content: prompt}],
    });
    const message = completion.data.choices[0].message.content;
    return message;
    //console.log('message', message);
    //const lines = message.split("\n")
    //const firstLine = lines[0].trim();
    //return firstLine;
  } catch (error) {
    console.error(error);
  }

  return '';
}

async function describePlace(character, history, roomName) {
  //console.log('describePlace', roomName);
  let prompt =
`This is a text-based role playing game set in a medieval fantasy world.

### History
${history.map((h) => `${h.character}: ${h.text}`).join('\n')}

### Instructions
Describe the ${roomName}, which ${character.name} just created. Keep the response brief, under 40 words. Add drama and enticing language. Use past tense. Only describe the ${roomName}. Do not describe ${character.name} or any other characters.

### Example
The tavern was a warm and inviting space, with a roaring fire and lively chatter. The cramped room was filled with low murmurs and the occasional clink of glasses.

### Response
`;

  //console.log(prompt);

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      temperature: 1.2,
      max_tokens: 80,
      messages: [{role: "user", content: prompt}],
    });
    const message = completion.data.choices[0].message.content;
    //console.log('message', message);
    const lines = message.split("\n")
    const firstLine = lines[0].trim();
    return firstLine;
  } catch (error) {
    console.error(error);
  }

  return '';
}

async function listMobs(room) {
  //console.log('describePlace', roomName);
  let prompt =
`This is a text-based role playing game set in a medieval fantasy world.

### THE ${room.name.toUpperCase()}
${room.description}

### Instructions
List 5 "mobs" (low level enemies) that the ${room.name} might contain. Output only the name of each individual mob. Do not describe the mobs or add any commentary.

### Example: The Meandering Caves
The meandering caves are home to many creatures, including:
- giant rat
- goblin
- bat
- slime
- spider

### Response
The ${room.name} is home to many creatures, including:
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
    const mobs = lines.slice(1).map((l) => l.replace('-', '').trim());
    return mobs.join(',');
  } catch (error) {
    console.error(error);
  }

  return '';
}

async function createPicture(description) {
  const response = await openai.createImage({
    prompt: `A beautiful, highly detailed oil painting in the style of realism. Circa 1802. ${description}`,
    n: 1,
    size: "512x512",
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

async function promptCharacterBuilder(history) {
  let prompt =
`This is a text-based role playing game set in a medieval fantasy world called Exousius. You are the narrator. You must gather information from the player to build their character. The player may be new to these lands, or they may be a seasoned warrior.

### Context
Exousius is a land of war. Before there was peace in the kingdom. But then came the discovery of soul summoning. Wizards and warriors searched far and wide for the precious soul shards, and were more than willing to kill for them. It is with sadness that you must bring the player into this world, for you need the player to fight in this senseless war.

### Instructions
Lead the player in conversation through the following steps:

1. Apologize to the player for the need to bring them here.

2. Determine if the player is new to these lands, or if they are a seasoned warrior.

3. Ask the player if they are skilled in magic, or in the sword. Use their response to determine their character (wizard, knight, rouge, etc).

4. Determine the character's clothing, distinguishing features, and backstory. This also does not matter for gameplay.

5. Determine the player's weapon. This also does not matter for gameplay.

6. Realize that you have forgotten to ask the player's name. Ask the player for their name -- but, their summoner's name, not their real name. Be willing to suggest a name if the player seems uncreative. Prefer short names. If the player gives a name like "Grimnor The Terrible", shorten it to just "Grimnor".

7. Ask "How do you prefer to be addressed? As 'he' or 'she'... or 'fae' perhaps?" Do not use the word "pronouns". The player may choose another title such as "they", "you", "it", etc.

8. Output the character's information in the following format:

%%% CHARACTER
Name: Player Name (Short)
Title: She
Description: The description of the player's character. Start with the character's name. Write in past tense. Use the character's pronouns. Do not describe the character as "something-like" (eg Dumbledore-like). Instead, use precise descriptions such as "has an old face, with long grey and black hair." Include the player's weapon. The description should be about 30 words long, all on one line.
%%%

(You MUST use the triple percent signs to delimit the output.)

Example: Alice the Pirate Princess

%%% CHARACTER
Name: Alice
Title: She
Description: She was known as Alice, the Pirate Princess. Once a princess, she became a swashbuckling pirate. She wielded a cutlass and a pistol. Alice had long, flowing hair and a scar on her left cheek.
%%%

9. Confirm that the player is happy with their character. If not, change the character to match the player's wishes. Output the character's information again in the same format as above.

10. Thank the player for their heroism, and welcome them to Exousius. Output the character information again. Then output %summon Player Name%. Once you output %summon ...%, the player will be sent to the world of Exousius.

Determine which step in the conversation you are on, and output a response approapriate for that step.

${pronounHint}

### History
${history.map((h) => `${h.character}: ${h.text}`).join('\n')}

### Response
Narrator: `;

//6. Realize you never asked for the player's name. Ask the player for their name. If the player gives a "bad name", demand that they give their "summoner name" instead. A bad name is a name that is too long (over 20 letters) or doesn't match the setting, especially real world names and inappropriate names. Also, the player may not pick the names Odel, Ekel, Mort or Temusea. (This setting already has characters with these names.) Be quick to help the player out by suggesting a setting appropriate name.
  //console.log(prompt);
  //return '%summon Odel%';

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      temperature: 1.2,
      max_tokens: 400,
      messages: [{role: "user", content: prompt}],
    });
    const message = completion.data.choices[0].message.content;
    let lines = message.split("\n");
    let badLine = -1;
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].startsWith('Narrator:') || lines[i].startsWith('Player:') || lines[i].startsWith('System:') || lines[i].startsWith('Step ')) {
        badLine = i;
        break;
      }
    }
    if (badLine !== -1) {
      lines = lines.slice(0, badLine);
    }
    const response = lines.join("\n");
    console.log('message', response);
    return response;
  } catch (error) {
    console.error(error);
  }

  return '';
}

module.exports = { promptBot, punchUpNarration, describePlace, listMobs, createPicture, promptCharacterBuilder };

