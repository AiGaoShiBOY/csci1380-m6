const {mapByAuthor} = require('./mapper');
const {reduceByAuthor} = require('./reducer');

/**
 * default map reduce configuration:
 *
 */
const config1 = {
  map: mapByAuthor,
  reduce: reduceByAuthor,
  memory: false,
  dataFolderId: 'articles',
  out: 'reduceResult',
};

module.exports = {config1};
