const socket = io();
let locale = 'en';
let lastHp = 10;
let lastShards = 0;

// Get the current username from Local Storage
//let myName = 'Player';
let myName = localStorage.getItem('character');
let characterInfo = '';
if (myName) {
  console.log('emit character', myName);
  socket.emit('character', myName);
} else {
  myName = 'Player';
  localStorage.setItem('character', myName);
}

socket.on('connect', () => {
  console.log('emit character', myName);
  socket.emit('character', myName);
});

socket.on('reconnect', () => {
  console.log('emit character', myName);
  socket.emit('character', myName);
});

socket.on('locale', (newLocale) => {
  console.log('locale', newLocale);
  locale = newLocale;
  window.locale = locale;

  const input = document.getElementById('message-input');
  input.placeholder = translations[locale].placeholder;

  const hp = document.getElementById('hp');
  hp.innerText = rewriteNumber(lastHp);
  console.log('rewriteNumber', lastHp, rewriteNumber(lastHp), rewriteNumber);

  const shards = document.getElementById('shards');
  shards.innerText = rewriteNumber(lastShards);
});

socket.on('character', (name) => {
  console.log('character', name);
  document.getElementById('player-name').innerText = name;
  myName = name;
  localStorage.setItem('character', myName);

  if (myName === 'Player') {
    document.getElementById('typing').style.display = 'block';
    document.body.classList.remove('hascharacter');
    document.body.classList.add('nocharacter');
  } else {
    document.getElementById('typing').style.display = 'none';
    document.body.classList.remove('nocharacter');
    document.body.classList.add('hascharacter');
  }
});

/*
const messageSound = new Audio('message.wav');
messageSound.volume = 0.5;
const serverSound = new Audio('server.wav');
serverSound.volume = 0.5;
*/
const soundQueue = [];
let mute = false;

function playSound(character) {
  if (mute) {
    return;
  }
  let sound = null;
  if (character === 'Narrator') {
    sound = new Audio('server.wav');
  } else {
    sound = new Audio('message.wav');
  }
  sound.volume = 0.5;
  sound.play();
  /*
  if (player === 'Narrator') {
    serverSound.play();
  } else {
    messageSound.play();
  }
  */
}

// Function to play sound and process messages from the queue
const processQueue = () => {
  if (soundQueue.length > 0) {
    // Play the message sound
    playSound(soundQueue[0]);

    // Remove the processed message from the queue
    soundQueue.shift();
  }
};

// Set an interval to process the message queue every 100ms
setInterval(processQueue, 250);

function scrollToBottom() {
  setTimeout(() => {
    const messageContainer = document.getElementById('message-container');
    messageContainer.scrollTop = messageContainer.scrollHeight;
  }, 100);
}

function setVhVariable() {
  let vh = window.innerHeight;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
  scrollToBottom();
}

setVhVariable();
window.addEventListener('resize', setVhVariable);
//setInterval(setVhVariable, 1000);


function getActionName(action) {
  let spaceNdx = action.indexOf(' ');
  let result = spaceNdx === -1 ?
    action.substring(1, action.length - 1) :
    action.substring(1, spaceNdx);
  result = translateAction(result);
  return result;
}

document.getElementById('message-input').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') { // && !event.shiftKey) {
      socket.emit('message', {text: event.target.value});
      event.target.value = '';
      event.preventDefault();
    }
});

function maybeSummonPlayer(action) {
  console.log('maybeSummonPlayer', action, myName, characterInfo);
  if (characterInfo === '') return;
  if (myName !== 'Player') return;
  if (!action.startsWith('%summon ')) return;

  let summonName = action.substring(8, action.length - 1);
  if (summonName === 'Player') return;
  if (summonName === 'Odel') return;
  if (summonName === 'Narrator') return;

  // Look for the phrase "Name: Character Name" in characterInfo
  let characterName = '';
  let characterNameNdx = characterInfo.indexOf('Name: ');
  if (characterNameNdx === -1) return;
  characterNameNdx += 6;
  let characterNameEndNdx = characterInfo.indexOf('\n', characterNameNdx);
  if (characterNameEndNdx === -1) return;
  characterName = characterInfo.substring(characterNameNdx, characterNameEndNdx);

  if (characterName === summonName) {
    console.log('summoning', summonName);
    setTimeout(() => {
      socket.emit('summon', characterInfo);
    }, 5000);
  }
}

function messageReceived(message) {
  // Show or hide the typing indicator
  if (myName === 'Player' && message.character !== 'Narrator') {
    document.getElementById('typing').style.display = 'block';
  } else {
    document.getElementById('typing').style.display = 'none';
  }

  const messages = document.getElementById('messages');

  // Creating div for character's name
  const nameElement = document.createElement('span');
  nameElement.innerText = message.character;
  nameElement.classList.add('name');

  // Creating div for the message
  const messageElement = document.createElement('div');
  messageElement.appendChild(nameElement);
  messageElement.classList.add('message');

  if (message.character === 'Narrator' && message.text === 'PROMOSURVEY') {
    messageElement.innerHTML = '<a class="text" href="https://forms.gle/knteLs8qrNTf5N9L7" target="_blank">Did "Exousius" change the way you feel about AI? Please answer this single-question anonymous survey.</a>';

  } else {
    let bigBlocks = message.text.split('%%%');
    for (let k = 0; k < bigBlocks.length; k++) {
      let block = bigBlocks[k];
      if (k % 2 === 0) {
        if (block[0] === '\n') {
          block = block.substring(1);
        }
        let textSegments = block.split('%');
        for (let i = 0; i < textSegments.length; i++) {
          if (i % 2 === 0) {
            const textElement = document.createElement('span');
            textElement.innerText = textSegments[i];
            textElement.classList.add('text');
            messageElement.appendChild(textElement);
          } else {
            const butt = document.createElement('button');
            const action = `%${textSegments[i]}%`;
            const actionName = getActionName(action);
            butt.innerText = action;
            butt.classList.add('suggestion');
            butt.classList.add(`suggestion-${actionName}`);
            butt.addEventListener('click', () => {
              if (onCooldown) return;
              startCooldown();
              socket.emit('message', {text: action});
            });
            messageElement.appendChild(butt);

            console.log("maybeSummonPlayer");
            maybeSummonPlayer(action);
          }
        }

      } else {
        if (block.startsWith("!")) {
          block = `%%%${block.substring(1)}%%%`;
        } else {
          characterInfo = block;
        }
        const blockElem = document.createElement('div');
        blockElem.innerText = block.trim();
        blockElem.classList.add('suggestion');
        blockElem.classList.add('block');
        messageElement.appendChild(blockElem);
      }
    }
  }

  if (message.character === 'Narrator') {
    messageElement.classList.add('system');
  } else if (message.character === myName) {
    messageElement.classList.add('me');
  }

  messages.appendChild(messageElement);

  scrollToBottom();
}

socket.on('message', async (message) => {
  soundQueue.push(message.character);
  messageReceived(message);
});

socket.on('previous messages', async (messages) => {
  console.log('previous messages', messages);
  for (let i = 0; i < messages.length; i++) {
    messageReceived(messages[i]);
  }
});

function reset() {
  socket.emit('reset');
  const messages = document.getElementById('messages');
  messages.innerHTML = '';
  //socket.emit('set-rate', currentRate);
}

socket.on('reset', function() {
  const messages = document.getElementById('messages');
  messages.innerHTML = '';
  //socket.emit('set-rate', currentRate);
});

socket.on('room', function(room) {
  let backgroundElement = document.getElementById('background');
  let roomElem = document.getElementById('room');
  const animationDelay = 1000;

  console.log(room);
  backgroundElement.style.opacity = 0;
  roomElem.style.opacity = 0;

  if (!room.image || room.image === '') {
    setTimeout(function() {
      document.getElementById('room').innerText = room.name;
      backgroundElement.style.background = '#333';
      roomElem.style.background = '#333';
      backgroundElement.style.opacity = 1;
      roomElem.style.opacity = 1;
    }, animationDelay);
    return;
  }

  let image = new Image();
  image.src = room.image;
  image.onload = function() {
    setTimeout(function() {
      document.getElementById('room').innerText = room.name;
      backgroundElement.style.background = `url(${room.image}), #333`;
      roomElem.style.background = `linear-gradient(180deg, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${room.image}), #333`;

      backgroundElement.style.backgroundSize = 'cover';
      backgroundElement.style.backgroundPosition = 'center';
      roomElem.style.backgroundSize = 'cover';
      roomElem.style.backgroundPosition = 'center';

      backgroundElement.style.opacity = 1;
      roomElem.style.opacity = 1;
    }, animationDelay);
  };
});

socket.on('shards', function(shards) {
  if (shards === lastShards) {
    return;
  }
  lastShards = shards;
  let shardsElem = document.getElementById('shards');
  setTimeout(() => {
    shardsElem.innerText = rewriteNumber(lastShards);
  }, 1000);
  shardsElem.classList.add('flash');
  shardsElem.addEventListener('animationend', () => {
    shardsElem.classList.remove('flash');
  }, {once: true});
});

socket.on('hp', function(hp) {
  lastHp = hp;
  let hpElem = document.getElementById('hp');
  hpElem.innerText = rewriteNumber(lastHp);
  if (hp < 5) {
    hpElem.classList.add('low');
  } else {
    hpElem.classList.remove('low');
  }
  /*
  const emptyOrb = document.querySelector('.empty-orb');
  const fullOrb = document.querySelector('.full-orb');
  const orbHeight = emptyOrb.offsetHeight;
  const percentage = hp / 10;
  console.log('percentage', percentage);
  fullOrb.style.height = `${orbHeight * percentage}px`; */

  const fullOrbContainer = document.querySelector('.full-orb-container');
  const orbHeight = fullOrbContainer.offsetHeight;
  const maxHp = 10;
  const percentage = (1 - hp / maxHp) * 100;

  fullOrbContainer.style.clipPath = `inset(${percentage}% 0% 0% 0%)`;
});

socket.on('scripts', function(scripts) {
  const scriptsElement = document.getElementById('scriptsContainer');
  scriptsElement.innerHTML = '';
  scripts.forEach((script) => {
    const scriptElement = document.createElement('button');
    scriptElement.classList.add('script');
    scriptsElement.appendChild(scriptElement);

    const scriptNameElement = document.createElement('div');
    scriptNameElement.innerText = script.name;
    scriptNameElement.classList.add('name');
    scriptElement.appendChild(scriptNameElement);

    const scriptTextElement = document.createElement('div');
    scriptTextElement.innerText = script.script;
    scriptTextElement.classList.add('text');
    scriptElement.appendChild(scriptTextElement);
  });
});

let onCooldown = false;
function startCooldown() {
  const suggestionsElement = document.getElementById('suggestions');
  suggestionsElement.classList.add('cooldown');
  onCooldown = true;
  setTimeout(() => {
    suggestionsElement.classList.remove('cooldown');
    onCooldown = false;
  }, 1000);
}

let lastSuggestions = [];
socket.on('suggestions', function(suggestions) {
  if (lastSuggestions.length === suggestions.length) {
    let same = true;
    for (let i = 0; i < suggestions.length; i++) {
      if (suggestions[i] !== lastSuggestions[i]) {
        same = false;
        break;
      }
    }
    if (same) {
      return;
    }
  }
  lastSuggestions = suggestions;

  let suggestionsElement = document.getElementById('suggestions');
  suggestionsElement.innerHTML = '';

  suggestions.forEach((suggestion) => {
    let suggestionElement = document.createElement('button');
    suggestionElement.innerText = suggestion;
    suggestionElement.classList.add('suggestion');
    suggestionElement.classList.add(`suggestion-${getActionName(suggestion)}`);
    suggestionElement.addEventListener('click', () => {
      if (onCooldown) {
        return;
      }
      socket.emit('message', {text: suggestion});
      startCooldown();
    });
    suggestionsElement.appendChild(suggestionElement);
  });
});

document.getElementById('reset').addEventListener('click', reset);
document.getElementById('send').addEventListener('click', sendMessage);
document.getElementById('mute').addEventListener('click', () => {
  mute = !mute;
  let muteElement = document.getElementById('mute');
  if (mute) {
    muteElement.classList.remove('active');
    muteElement.innerHTML = '<i class="fas fa-volume-mute"></i>';
  } else {
    muteElement.classList.add('active');
    muteElement.innerHTML = '<i class="fas fa-volume-up"></i>';
  }
  playSound("player");
});

/*
document.getElementById('scriptsButton').addEventListener('click', () => {
  let scriptsElement = document.getElementById('scriptsPanel');
  if (scriptsElement.style.display === 'none') {
    scriptsElement.style.display = 'block';
  } else {
    scriptsElement.style.display = 'none';
  }
});
*/

const rateButtons = [
  { elementId: 'rate-0', rate: 0 },
  { elementId: 'rate-1', rate: 10000 },
  { elementId: 'rate-2', rate: 6000 },
  { elementId: 'rate-3', rate: 3000 },
];

let currentActiveButtonId = 'rate-1';
let lastRate = 10000;
let currentRate = 10000;

rateButtons.forEach(({ elementId, rate }) => {
  document.getElementById(elementId).addEventListener('click', () => {
    socket.emit('set-rate', rate);
    document.getElementById(currentActiveButtonId).classList.remove('active');
    document.getElementById(elementId).classList.add('active');
    currentActiveButtonId = elementId;
    lastRate = rate;
    currentRate = rate;
  });
});

document.getElementById(currentActiveButtonId).classList.add('active');

function sendMessage() {
  const input = document.getElementById('message-input');
  if (!input.value) {
    return;
  }
  socket.emit('message', { text: input.value });
  input.value = '';
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    //socket.emit('set-rate', 0);
    currentRate = 0;
    // Highlight the 'pause' button
    document.getElementById(currentActiveButtonId).classList.remove('active');
    document.getElementById('rate-0').classList.add('active');
  } else {
    //socket.emit('set-rate', lastRate);
    currentRate = lastRate;
    // Highlight the last active button
    document.getElementById(currentActiveButtonId).classList.add('active');
    document.getElementById('rate-0').classList.remove('active');
  }
});

// Force HTTPS
/*
window.onload = function() {
  var currentUrl = window.location.href;
  var currentProtocol = window.location.protocol;
  console.log("Should we force HTTPS? Current protocol: " + currentProtocol + " Current URL: " + currentUrl);

  if(currentProtocol !== 'https:' && !currentUrl.includes('localhost')) {
    console.log("Redirecting to HTTPS");
    window.location.href = 'https:' + window.location.href.substring(window.location.protocol.length);
  }
};
*/

