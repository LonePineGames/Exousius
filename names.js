
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

module.exports = { NameServer };
