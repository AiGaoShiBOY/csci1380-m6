const {id} = require('../util/util');
const query = function (config) {
  let context = {};
  context.gid = config.gid || 'all';
  context.hash = config.hash || id.naiveHash;
  let distribution = global.distribution;
  if (!distribution) {
    throw new Error('Distribution not found');
  }

  return {
    /**
     * Query the number of papers by given keyword of author
     * @param {*} keyword
     * @param {*} gid The output folder specified by out
     * @param {*} callback
     */
    queryNumberOfPapers: function (operation, keyword, gid, callback) {
      callback = callback || function (e, v) {};
      const message = [operation, keyword, gid];
      const remote = {service: 'query', method: 'queryNumberOfPapers'};
      distribution[context.gid].comm.send(message, remote, (e, v) => {
        const values = Object.values(v);
        const filteredArrays = values.filter((value) => Array.isArray(value));
        const mergedArray = filteredArrays.flat();
        callback(null, mergedArray);
      });
    },
  };
};

module.exports = query;
