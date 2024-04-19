const {engineNodes} = require('./config');
const util = require('../distribution/util/util');
const distribution = require('../distribution');

async function shutdownNodes(localServer) {
  for (const node of engineNodes) {
    let remote = {service: 'status', method: 'stop'};
    remote.node = node;
    const sendPromise = util.promisify(distribution.local.comm.send);
    await sendPromise([], remote);
  }
  localServer.close();
  console.log('All nodes have been shut down');
}

module.exports = shutdownNodes;
