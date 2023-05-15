const translations = {
  en: {
    placeholder: 'Write your story...',
    Player: 'Player',
    Narrator: 'Narrator',
    Name: 'Name',
    Title: 'Title',
    Description: 'Description',
    '1': '1',
    '2': '2',
    '3': '3',
    '4': '4',
    '5': '5',
    '6': '6',
    '7': '7',
    '8': '8',
    '9': '9',
    '0': '0',

    "action.go": "go",
    "action.create": "create",
    "action.give": "give",
    "action.scry": "scry",
    "action.return": "return",
    "action.disappear": "disappear",
    "action.strike": "strike",
    "action.summon": "summon",
    "action.heal": "heal",
    "action.protect": "protect",
    "action.search": "search",
    "action.destroy": "destroy",
  },

  th: {
    placeholder: 'เขียนเรื่องราวของคุณ...',
    Player: 'ผู้เล่น',
    Narrator: 'ผู้เล่าเรื่อง',
    Name: 'ชื่อ',
    Title: 'ชื่อเรื่อง',
    Description: 'คำอธิบาย',
    '1': '๑',
    '2': '๒',
    '3': '๓',
    '4': '๔',
    '5': '๕',
    '6': '๖',
    '7': '๗',
    '8': '๘',
    '9': '๙',
    '0': '๐',

    "action.go": "ไป",
    "action.create": "สร้าง",
    "action.give": "ให้",
    "action.scry": "สกรี",
    "action.return": "การกลับมา",
    "action.disappear": "หายไป",
    "action.strike": 'ตี',
    "action.summon": "เรียก",
    "action.heal": "รักษา",
    "action.protect": "ป้องกัน",
    "action.search": "ค้นหา",
    "action.destroy": "ทำลาย",
  },
};

function rewriteNumber(number) {
  let result = '';
  let numberString = number.toString();
  for (let i = 0; i < numberString.length; i++) {
    result += translations[window.locale][numberString[i]];
    console.log('rewriteNumber', numberString[i], result);
  }
  console.log('rewriteNumber', number, result);
  return result;
}

function translateAction(action) {
  let languages = Object.keys(translations);
  for (let j = 0; j < languages.length; j++) {
    let language = languages[j];
    let translation = translations[language];
    let keys = Object.keys(translation);
    for (let i = 0; i < keys.length; i++) {
      let key = keys[i];
      if (key.startsWith('action.')) {
        if (translation[key] === action) {
          return key.split('.')[1];
        }
      }
    }
  }

  return action;
}

