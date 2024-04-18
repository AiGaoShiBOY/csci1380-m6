const {mapByAuthor} = require('./mapper');
const {reduceByAuthor} = require('./reducer');

const config1 = {
  map: mapByAuthor,
  reduce: reduceByAuthor,
  memory: false,
  dataFolderId: 'articles',
  out: 'mr-result',
};

module.exports = {config1};
