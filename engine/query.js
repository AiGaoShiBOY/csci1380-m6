const {queryOps} = require('./config');
const util = require('../distribution/util/util');
const {mapReduceConfig, engineConfig} = require('./config');

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function query(ops, keyword) {
  // 这里是您的查询逻辑
  console.log(`operation: ${queryOps[ops]}, search term: ${keyword}`);
  const res = await util.promisify(
    distribution[engineConfig.gid].query.queryNumberOfPapers,
  )(queryOps[ops], keyword, mapReduceConfig.out);
  console.log('===================== Result😄 =======================');
  console.log(res);
}

async function runQuery() {
  return new Promise((resolve) => {
    rl.question('Please enter the operation codes and search term (enter q to exit): \n operation code : \n 1 for numbers of papar \n 2 for paper title \n 3 for conference attandence \n', async (input) => {
      if (input.toLowerCase() === 'q') {
        rl.close();
        resolve();
        return;
      }

      const [ops, keyword] = input.split(' ');
      await query(ops, keyword);
      resolve(runQuery());
    });
  });
}

module.exports = runQuery;
