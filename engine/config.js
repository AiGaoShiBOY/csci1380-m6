const distribution = require('../distribution');
const util = require('../distribution/util/util');
const {config1} = require('../distribution/config/config');

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

/**
 * define the mapReduce config
 */
const mapReduceConfig = config1;

/**
 * whether clearing the original data
 */
const clearOriginalData = true;

/**
 * query operations
 */
const queryOps = Object.freeze({
  1: 'numberOfPapers',
  2: 'titles',
  3: 'conferences',
});

module.exports = {
  orchestrator,
  nodeNum,
  engineConfig,
  engineGroup,
  engineNodes,
  mapReduceConfig,
  clearOriginalData,
  queryOps,
};
