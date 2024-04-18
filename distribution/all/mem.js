const {id} = require('../util/util');

const mem = function (config) {
  let context = {};
  context.gid = config.gid || 'all';
  context.hash = config.hash || id.naiveHash;
  let distribution = global.distribution;
  // if (!distribution) {
  //   throw new Error('Distribution not found');
  // }
  return {
    /**
     * Usage: the same with store.put
     * @param {*} value
     * @param {*} keyInput
     * @param {*} callback
     */
    put: function (value, keyInput, callback) {
      callback = callback || function () {};
      distribution.local.groups.get(context.gid, (e, v) => {
        if (e) {
          callback(e, null);
          return;
        }

        let realKey;
        let gidForFolder;
        if (typeof keyInput === 'string') {
          realKey = keyInput;
          gidForFolder = context.gid;
        } else if (typeof keyInput === 'object' && keyInput !== null) {
          realKey = keyInput.key ? keyInput.key : id.getID(value);
          if (keyInput.gid) {
            gidForFolder = keyInput.gid;
          } else {
            callback(
              new Error('You cannot input a object for store.put without gid'),
              null,
            );
          }
        } else {
          realKey = id.getID(value);
          gidForFolder = context.gid;
        }

        // get all the nodes
        const nodesArray = Object.values(v);
        const nids = nodesArray.map((node) => id.getNID(node));

        // get the hash of the value
        const kid = id.getID(realKey);
        const expectedHash = context.hash(kid, nids.slice());

        const targetIdx = nids.indexOf(expectedHash);
        const targetNode = nodesArray[targetIdx];

        const keyWithGid = {
          key: realKey,
          gid: gidForFolder,
        };

        const message = [value, keyWithGid];
        const remoteWithNode = {
          node: {ip: targetNode.ip, port: targetNode.port},
          service: 'mem',
          method: 'put',
        };
        distribution.local.comm.send(message, remoteWithNode, (e, v) => {
          if (e) {
            callback(e, null);
            return;
          }
          callback(null, v);
          return;
        });
      });
    },

    /**
     * Usage: the same with store.get
     * @param {*} key
     * @param {*} callback
     */
    get: function (keyInput, callback) {
      callback = callback || function () {};
      distribution.local.groups.get(context.gid, (e, v) => {
        if (e) {
          callback(e, null);
          return;
        }

        let realKey;
        let gidForFolder;
        if (typeof keyInput === 'string') {
          realKey = keyInput;
          gidForFolder = context.gid;
        } else if (typeof keyInput === 'object' && keyInput !== null) {
          realKey = keyInput.key ? keyInput.key : null;
          if (keyInput.gid) {
            gidForFolder = keyInput.gid;
          } else {
            callback(
              new Error('You cannot input a object for store.put without gid'),
              null,
            );
          }
        } else {
          realKey = null;
          gidForFolder = context.gid;
        }

        if (realKey) {
          // get all the nodes
          const nodesArray = Object.values(v);
          const nids = nodesArray.map((node) => id.getNID(node));

          // get the hash of the value
          const kid = id.getID(realKey);
          const expectedHash = context.hash(kid, nids.slice());

          const targetIdx = nids.indexOf(expectedHash);
          const targetNode = nodesArray[targetIdx];

          const keyWithGid = {
            key: realKey,
            gid: gidForFolder,
          };

          const message = [keyWithGid];
          const remoteWithNode = {
            node: {ip: targetNode.ip, port: targetNode.port},
            service: 'mem',
            method: 'get',
          };
          // send to the specified node to get the value
          distribution.local.comm.send(message, remoteWithNode, (e, v) => {
            if (e) {
              callback(e, null);
              return;
            }
            callback(null, v);
            return;
          });
        } else {
          const keyWithGid = {
            key: null,
            gid: gidForFolder,
          };
          const message = [keyWithGid];
          const remote = {service: 'mem', method: 'get'};
          distribution[context.gid].comm.send(message, remote, (e, v) => {
            if (!v || Object.keys(v).length === 0) {
              callback(new Error('There is no data of given group', null));
              return;
            }
            const allKeys = [].concat(...Object.values(v));
            callback({}, allKeys);
            return;
          });
        }
      });
    },

    /**
     * Usage: the same with store.del
     * @param {*} key
     * @param {*} callback
     */
    del: function (keyInput, callback) {
      callback = callback || function () {};
      distribution.local.groups.get(context.gid, (e, v) => {
        if (e) {
          callback(e, null);
          return;
        }

        let realKey;
        let gidForFolder;
        if (typeof keyInput === 'string') {
          realKey = keyInput;
          gidForFolder = context.gid;
        } else if (typeof keyInput === 'object' && keyInput !== null) {
          realKey = keyInput.key ? keyInput.key : null;
          if (keyInput.gid) {
            gidForFolder = keyInput.gid;
          } else {
            callback(
              new Error('You cannot input a object for store.del without gid'),
              null,
            );
          }
        } else {
          realKey = null;
          gidForFolder = context.gid;
        }

        if (!realKey) {
          callback(new Error('You must specify a key for store.del'), null);
          return;
        }

        // get all the nodes
        const nodesArray = Object.values(v);
        const nids = nodesArray.map((node) => id.getNID(node));

        // get the hash of the value
        const kid = id.getID(realKey);
        const expectedHash = context.hash(kid, nids.slice());

        const targetIdx = nids.indexOf(expectedHash);
        const targetNode = nodesArray[targetIdx];

        const keyWithGid = {
          key: realKey,
          gid: gidForFolder,
        };

        const message = [keyWithGid];
        const remoteWithNode = {
          node: {ip: targetNode.ip, port: targetNode.port},
          service: 'mem',
          method: 'del',
        };

        // send to the specified node to get the value
        distribution.local.comm.send(message, remoteWithNode, (e, v) => {
          if (e) {
            callback(e, null);
            return;
          }
          callback(null, v);
          return;
        });
      });
    },

    /**
     * Usage: the same with store.append
     * @param {*} value
     * @param {*} key
     * @param {*} callback
     */
    append: function (value, keyInput, callback) {
      callback = callback || function () {};
      distribution.local.groups.get(context.gid, (e, v) => {
        if (e) {
          callback(e, null);
          return;
        }

        let realKey;
        let gidForFolder;
        if (typeof keyInput === 'string') {
          realKey = keyInput;
          gidForFolder = context.gid;
        } else if (typeof keyInput === 'object' && keyInput !== null) {
          realKey = keyInput.key ? keyInput.key : id.getID(value);
          if (keyInput.gid) {
            gidForFolder = keyInput.gid;
          } else {
            callback(
              new Error('You cannot input a object for store.put without gid'),
              null,
            );
          }
        } else {
          realKey = id.getID(value);
          gidForFolder = context.gid;
        }

        // get all the nodes
        const nodesArray = Object.values(v);
        const nids = nodesArray.map((node) => id.getNID(node));

        // get the hash of the value
        // if the key is null, do multiple hash;
        const kid = id.getID(realKey);
        const expectedHash = context.hash(kid, nids.slice());

        const targetIdx = nids.indexOf(expectedHash);
        const targetNode = nodesArray[targetIdx];

        const keyWithGid = {
          key: realKey,
          gid: gidForFolder,
        };

        const message = [value, keyWithGid];
        const remoteWithNode = {
          node: {ip: targetNode.ip, port: targetNode.port},
          service: 'mem',
          method: 'append',
        };
        distribution.local.comm.send(message, remoteWithNode, (e, v) => {
          if (e) {
            callback(e, null);
            return;
          }
          callback(null, v);
          return;
        });
      });
    },
    reconf: function (originalGroup, callback) {
      callback = callback || function () {};
      distribution.local.groups.get(context.gid, (e, v) => {
        if (e) {
          callback(e, null);
          return;
        }

        const oldGroup = Object.values(originalGroup);
        const newGroup = Object.values(v);

        // get all the keys
        distribution[context.gid].mem.get(null, (e, v) => {
          if (Object.keys(e).length !== 0) {
            callback(e, null);
            return;
          }

          const oldNids = oldGroup.map((node) => id.getNID(node));
          const newNids = newGroup.map((node) => id.getNID(node));

          let needReconf = 0;

          // iterate every key
          v.forEach((key) => {
            const kid = id.getID(key);
            const oldHash = context.hash(kid, oldNids.slice());
            const newHash = context.hash(kid, newNids.slice());

            // needs relocate
            if (oldHash !== newHash) {
              needReconf += 1;
              oldIdx = oldNids.indexOf(oldHash);
              oldNode = oldGroup[oldIdx];

              const keyWithGid = {
                key: key,
                gid: context.gid,
              };

              const message = [keyWithGid];
              const oldRemote = {
                node: {ip: oldNode.ip, port: oldNode.port},
                service: 'mem',
                method: 'del',
              };

              // del data in the old node
              distribution.local.comm.send(message, oldRemote, (e, value) => {
                if (e) {
                  callback(e);
                  return;
                }

                // put the data to the new node
                // the data deleted is store in value
                newIdx = newNids.indexOf(newHash);
                newNode = newGroup[newIdx];

                const newKeyWithGid = {
                  key: key,
                  gid: context.gid,
                };

                const message = [value, newKeyWithGid];
                const newRemote = {
                  node: {ip: newNode.ip, port: newNode.port},
                  service: 'mem',
                  method: 'put',
                };

                distribution.local.comm.send(message, newRemote, (e, v) => {
                  if (e) {
                    callback(e);
                    return;
                  }
                  needReconf -= 1;
                  if (needReconf === 0) {
                    callback(null, 1);
                  }
                });
              });
            }
          });
        });
      });
    },
  };
};

module.exports = mem;
