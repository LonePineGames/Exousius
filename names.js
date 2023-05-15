const { getLocale } = require('./international');

class NameServer {
  constructor() {
    this.names = [
      'John',
      'Paul',
      'George',
      'Ringo',
      'Pete',
      'Julie',
      'Yoko',
      'Mick',
      'Kyle',
      'Kurt',
      'Anne',
      'Diane',
      'Nancy',
      'Joan',
      'Stevie',
      'Linda',
      'Patti',
      'Kim',
      'Kate',
      'Carol',
      'Janis',
      'Grace',
      'Abdul',
      'David',
      'Brian',
      'Chris',
      'Phil',
      'Roger',
      'Elton',
      'Bono',
      'Bruce',
      'Bob',
      'Tom',
      'Alvan',
      'Sally',
      'Karen',
      'Alice',
      'Joni',
      'Madonna',
      'Britney',
      'Whitney',
      'Tina',
      'SrinivasaRamanujan',
    ];

  }

  getUnusedName() {
    if (this.names.length === 0) {
      throw new Error('No more names available');
    }
    const index = Math.floor(Math.random() * this.names.length);
    const name = this.names[index];
    this.names.splice(this.names.indexOf(name), 1);
    return name;
  }
}

function listNames(names) {
  const locale = getLocale();
  if (locale === 'en') {
    if (names.length === 0) {
      return 'no one';
    } else if (names.length >= 2) {
      return names.slice(0, -1).join(', ') + ' and ' + names.slice(-1);
    } else {
      return names.join('');
    }

  } else if (locale === 'th') {
    if (names.length === 0) {
      return 'ไม่มีใคร';
    } else if (names.length >= 2) {
      return names.slice(0, -1).join(', ') + ' และ ' + names.slice(-1);
    } else {
      return names.join('');
    }
  }
}

module.exports = { NameServer, listNames };
