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

