const {engineNodes} = require('./config');
const {engineConfig} = require('./config');
const {engineGroup} = require('./config');
const util = require('../distribution/util/util');
const groupsTemplate = require('../distribution/all/groups');
const fs = require('fs');
const path = require('path');
const distribution = require('../distribution');

async function initialize(clearOriginalData = true) {
  // first clean up the storage;
  if (clearOriginalData) {
    const directoryPath = path.join(__dirname, '../store');
    fs.rmSync(directoryPath, {recursive: true, force: true});
    fs.mkdirSync(directoryPath);
  }

  // second spawn all the nodes
  const spawnPromise = util.promisify(distribution.local.status.spawn);
  for (const node of engineNodes) {
    await spawnPromise(node);
  }

  // initialize the group
  await util.promisify(groupsTemplate(engineConfig).put)(
    engineConfig,
    engineGroup,
  );
}

module.exports = initialize;
