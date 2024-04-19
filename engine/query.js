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
  console.log(`执行查询操作: ${queryOps[ops]}, 关键词: ${keyword}`);
  const res = await util.promisify(
    distribution[engineConfig.gid].query.queryNumberOfPapers,
  )(queryOps[ops], keyword, mapReduceConfig.out);
  console.log('===================== Result😄 =======================');
  console.log(res);
}

async function runQuery() {
  return new Promise((resolve) => {
    rl.question('请输入查询操作和关键词(输入 q 退出): ', async (input) => {
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
