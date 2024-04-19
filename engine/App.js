const shutdownNodes = require('./cleanup');
const initialize = require('./init');
const startCrawl = require('./crawler');
const distribution = require('../distribution');

let localServer = null;

function main() {
  distribution.node.start(async (server) => {
    try {
      await initialize();
      await startCrawl();
      await shutdownNodes(server);
    } catch (e) {
      await shutdownNodes(server);
    }
  });
}

main();
