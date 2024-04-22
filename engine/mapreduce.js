const distribution = require('../distribution');
const util = require('../distribution/util/util');
const {mapReduceConfig, engineConfig} = require('./config');

async function doMapReduce() {
  const articleKeys = await util.promisify(
    distribution[engineConfig.gid].store.get,
  )({
    gid: 'articles',
  });

  mapReduceConfig.keys = articleKeys;
  const res = await util.promisify(distribution[engineConfig.gid].mr.exec)(
    mapReduceConfig,
  );
  //console.log(res);
}

module.exports = doMapReduce;
