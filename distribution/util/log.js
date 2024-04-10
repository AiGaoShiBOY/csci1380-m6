const fs = require('fs');
const path = require('path');
const {getSID} = require('./id');

const log = function(message) {
  const nodeConfig = global.nodeConfig;
  const logPath = path.join(__dirname, '../../log');
  if (!fs.existsSync(logPath)) {
    fs.mkdirSync(logPath, {recursive: true});
  }
  const filePath = path.join(logPath, getSID(nodeConfig));
  fs.writeFileSync(filePath,
      getSID(nodeConfig) + '\n' + JSON.stringify(nodeConfig) + '\n' + message);
};

module.exports = log;
