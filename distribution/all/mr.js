const util = require('../util/util');
const {id} = require('../util/util');

const mr = function (config) {
  let context = {};
  context.gid = config.gid || 'all';
  let distribution = global.distribution;

  return {
    exec: (configuration, callback) => {
      /* Change this with your own exciting Map Reduce code! */

      // in order to access the store position inside the node for m6
      let dataFolderId;
      if (configuration.hasOwnProperty('dataFolderId')) {
        dataFolderId = configuration.dataFolderId;
      } else {
        dataFolderId = context.gid;
      }

      const keys = configuration.keys;
      if (keys === undefined) {
        callback(new Error('Configuration invalid'), null);
      }
      const mapper = configuration.map;
      if (!mapper) {
        callback(new Error('Configuration invalid', null));
      }
      const reducer = configuration.reduce;
      if (!reducer) {
        callback(new Error('Configuration invalid', null));
      }

      const mrId = 'mr' + id.getSID(configuration);
      let out = configuration.out;
      if (!out) {
        out = null;
      }

      let memory = configuration.memory ? 'mem' : 'store';

      let compactor = configuration.compact ? configuration.compact : null;

      const mrService = {
        map: mapWrapper,
        shuffle: shuffleWrapper,
        reduce: reduceWrapper,
      };

      distribution[context.gid].routes.put(mrService, mrId, (e, v) => {
        const message = [keys, dataFolderId, mapper, memory];
        const remote = {
          service: mrId,
          method: 'map',
        };
        distribution[context.gid].comm.send(message, remote, (e, v) => {
          //console.log(v, "result after map");
          const message = [keys, context.gid, dataFolderId, memory, compactor];
          const remote = {
            service: mrId,
            method: 'shuffle',
          };
          distribution[context.gid].comm.send(message, remote, (e, v) => {
            //console.log(v, "result after shuffle");
            const values = Object.values(v);
            const flattenedValues = values.flat();
            const keySet = new Set(flattenedValues);
            const mappedKeys = [...keySet];
            const message = [mappedKeys, context.gid, reducer, out, memory];
            const remote = {
              service: mrId,
              method: 'reduce',
            };
            distribution[context.gid].comm.send(message, remote, (e, v) => {
              //console.log(v, "result after reduce");
              const values = Object.values(v);
              const nonEmptyResults = values.filter(
                (arr) => arr && arr.length > 0,
              );
              const result = nonEmptyResults.flat();
              callback(null, result);
            });
          });
        });
      });
    },
  };
};

const mapWrapper = function (keys, gid, mapper, memory, callback) {
  let cnt = keys.length;
  // for every key
  keys.forEach((key) => {
    // get the key from local storage
    global.distribution.local.store.get({key: key, gid: gid}, (e, v) => {
      // if the key stores in the local storage
      if (v) {
        // apply the mapper on the data
        const mappedData = mapper(key, v);
        //console.log(mappedData, "data after mapper");
        // store the data
        global.distribution.local['store'].put(
          mappedData,
          {key: key, gid: 'mappedData'},
          (e, v) => {
            cnt--;
            if (cnt === 0) {
              callback(null, 1);
              return;
            }
          },
        );
      } else {
        cnt--;
        if (cnt === 0) {
          callback(null, 1);
          return;
        }
      }
    });
  });
};

const shuffleWrapper = function (
  keys,
  contextgid,
  gid,
  memory,
  compactor,
  callback,
) {
  let cnt = keys.length;
  let keySet = [];
  keys.forEach((key) => {
    // get the key from local storage
    global.distribution.local['store'].get(
      {key: key, gid: 'mappedData'},
      (e, v) => {
        if (v) {
          let value;
          if (compactor) {
            value = compactor(v);
          } else {
            value = v;
          }
          if (Array.isArray(value)) {
            if (!value || value.length === 0) {
              cnt--;
              if (cnt === 0) {
                callback(null, keySet);
                return;
              }
              return;
            }
            let cnt2 = value.length;
            for (const obj of value) {
              let [newKey, newVal] = Object.entries(obj)[0];
              // if the key contains "/", remove it to avoid conflicts with paths
              if (newKey.includes('/')) {
                newKey = newKey.replace(/\//g, '');
              }
              keySet.push(newKey);
              const newKeyWithGid = {
                key: newKey,
                gid: 'shuffleResult',
              };
              global.distribution[contextgid][memory].append(
                newVal,
                newKeyWithGid,
                (e, v) => {
                  cnt2--;
                  if (cnt2 === 0) {
                    cnt--;
                    if (cnt === 0) {
                      callback(null, keySet);
                    }
                  }
                },
              );
            }
          } else {
            let [newKey, newVal] = Object.entries(value)[0];
            keySet.push(newKey);
            const newKeyWithGid = {
              key: newKey,
              gid: 'shuffleResult',
            };
            global.distribution[contextgid][memory].append(
              newVal,
              newKeyWithGid,
              (e, v) => {
                cnt--;
                if (cnt === 0) {
                  callback(null, keySet);
                }
              },
            );
          }
        } else {
          cnt--;
          if (cnt === 0) {
            callback(null, keySet);
            return;
          }
        }
      },
    );
  });
};

const reduceWrapper = function (keys, gid, reducer, out, memory, callback) {
  let cnt = keys.length;
  let resultArr = [];
  keys.forEach((key) => {
    global.distribution.local[memory].del(
      {key: key, gid: 'shuffleResult'},
      (e, v) => {
        // get the value from storage
        if (v) {
          const reduceRes = reducer(key, v);
          //console.log(reduceRes);
          // store the res to out group
          if (out) {
            global.distribution[gid]['store'].append(
              reduceRes,
              {key: key, gid: out},
              (e, v) => {
                cnt--;
                resultArr.push(reduceRes);
                if (cnt === 0) {
                  callback(null, resultArr);
                }
              },
            );
          } else {
            cnt--;
            resultArr.push(reduceRes);
            if (cnt === 0) {
              callback(null, resultArr);
            }
          }
        } else {
          cnt--;
          if (cnt === 0) {
            callback(null, resultArr);
          }
        }
      },
    );
  });
};

module.exports = mr;
