const fs = require('fs');
const path = require('path');
const {getSID} = require('./id');

const log = function(message, fileName = null) {
  const nodeConfig = global.nodeConfig;
  const logPath = path.join(__dirname, '../../log');
  if (!fs.existsSync(logPath)) {
    fs.mkdirSync(logPath, {recursive: true});
  }
  let filePath;
  if (!fileName) {
    filePath = path.join(logPath, getSID(nodeConfig));
  } else {
    filePath = path.join(logPath, fileName);
  }
  fs.writeFileSync(
      filePath,
      getSID(nodeConfig) + '\n' + JSON.stringify(nodeConfig) + '\n' + message,
  );
};

module.exports = log;
