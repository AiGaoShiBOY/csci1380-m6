const distribution = require('../../distribution');
const store = require('./store');
const fs = require('fs');
const path = require('path');
const util = require('../../distribution/util/util');

const query = {};

query.queryNumberOfPapers = (operation, keyword, gid, callback) => {
  callback = callback || function (e, v) {};

  const baseFolderPath = path.join(
    __dirname,
    '../../store',
    's-' + util.id.getSID(global.nodeConfig),
  );

  if (!fs.existsSync(baseFolderPath)) {
    fs.mkdirSync(baseFolderPath);
  }

  const storeFolderPath = path.join(baseFolderPath, gid);

  try {
    const allKeys = fs.readdirSync(storeFolderPath);
    const filteredKeys = allKeys.filter((key) =>
      key.toLowerCase().includes(keyword.toLowerCase()),
    );
    if (filteredKeys.length > 0) {
      const results = [];
      for (const targetKey of filteredKeys) {
        const filePath = path.join(storeFolderPath, targetKey);
        const content = fs.readFileSync(filePath, 'utf8');
        const value = util.deserialize(content);
        let tmp = {};
        tmp['author'] = targetKey;
        tmp[operation] = value[0][targetKey][operation];
        results.push(tmp);
        // results.push({
        //   author: targetKey,
        //   numberOfPapers: value[0][targetKey]['numberOfPapers'],
        //   operation: value[0][targetKey][operation],
        // });
      }
      callback(null, results);
      return;
    } else {
      callback(null, null);
      return;
    }
  } catch (e) {
    callback(e, null);
    return;
  }
};

module.exports = query;
