const distribution = require('../distribution');
const util = require('../distribution/util/util');

/**
 * engine configuration
 */

/**
 * define orchestrator
 */
const orchestrator = {ip: '127.0.0.1', port: 7000};

/**
 * define engine's node number
 */
const nodeNum = 5;

/**
 * define the group name for the engine
 */
const engineConfig = {gid: 'engine'};

/**
 * define the node detail for the engine
 */
let engineGroup = {};
let engineNodes = [];
for (let i = 0; i < nodeNum; ++i) {
  let port = 7001 + i;
  let node = {ip: '127.0.0.1', port: port};
  engineGroup[util.id.getSID(node)] = node;
  engineNodes.push(node);
}

module.exports = {
  orchestrator,
  nodeNum,
  engineConfig,
  engineGroup,
  engineNodes,
};
