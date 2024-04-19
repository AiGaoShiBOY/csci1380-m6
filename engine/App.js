const shutdownNodes = require('./cleanup');
const initialize = require('./init');
const startCrawl = require('./crawler');
const distribution = require('../distribution');
const doMapReduce = require('./mapreduce');
const {clearOriginalData} = require('./config');
const runQuery = require('./query');

let localServer = null;

function main() {
  distribution.node.start(async (server) => {
    try {
      console.log(
        '===================== Start Init...🚛 =======================',
      );
      await initialize(clearOriginalData);
      if (clearOriginalData) {
        console.log(
          '===================== Start Crawling...🚛 =======================',
        );
        await startCrawl();
      }
      console.log(
        '===================== Start MapReduce...🚛 =======================',
      );
      await doMapReduce();
      await runQuery();
      await shutdownNodes(server);
    } catch (e) {
      await shutdownNodes(server);
    }
  });
}

main();
