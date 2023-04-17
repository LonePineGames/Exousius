
let names = [
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
];

const getUnusedName = () => {
  if (names.length === 0) {
    throw new Error('No more names available');
  }
  const index = Math.floor(Math.random() * names.length);
  const name = names[index];
  names.splice(names.indexOf(name), 1);
  return name;
}

module.exports = { getUnusedName };
