const {id} = require('../util/util');
const fs = require('fs');
const path = require('path');

const store = function (config) {
  let context = {};
  context.gid = config.gid || 'all';
  context.hash = config.hash || id.naiveHash;
  let distribution = global.distribution;
  if (!distribution) {
    throw new Error('Distribution not found');
  }

  // const baseFolderPath = path.join(
  //   __dirname,
  //   '../../store',
  //   's-' + id.getSID(global.nodeConfig),
  // );
  // if (!fs.existsSync(baseFolderPath)) {
  //   fs.mkdirSync(baseFolderPath);
  // }

  // const groupPath = path.join(baseFolderPath, context.gid);
  // if (!fs.existsSync(groupPath)) {
  //   fs.mkdirSync(groupPath);
  // }

  return {
    /** Usage:
    1. store.put (val, "key"): put a <key> to context.gid
    2. store.put (val, null): put a <getID(value)> to context.gid
    3. store.put (val, {key: "key", gid: "gid"})"" put a <key> to "gid" folder,
    stored by context.gid.
    4. store.put (val, {key: null, gid: "gid"})"" put a <getID(value)> to "gid" folder,
    stored by context.gid.
    **/

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
          service: 'store',
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
     * Usage:
     * 1. store.get ("key", callback) get a single value from store/context.gid
     * 2. store.get ({key: "key", gid: "gid"}, callback) get a single value,
     * from "store/gid"
     * 3. store.get(null, callback) get all keys from store/context.gid
     * 4. store.get ({key: null, gid: "gid"}, callback) get all keys
     * from "store/gid".
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
              new Error('You cannot input a object for store.get without gid'),
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
            service: 'store',
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
          // if the key is null, send the message to all
          const keyWithGid = {
            key: null,
            gid: gidForFolder,
          };
          const message = [keyWithGid];
          const remote = {service: 'store', method: 'get'};
          distribution[context.gid].comm.send(message, remote, (e, v) => {
            if (!v || Object.keys(v).length === 0) {
              callback(
                new Error('There is no data stored of given group', null),
              );
              return;
            }
            const allKeys = [].concat(...Object.values(v));
            callback({}, allKeys);
            return;
          });
        }
      });
    },

    /** Usage:
    1. store.del ("key"): del a <key> from context.gid
    2. store.del ({key: "key", gid: "gid"})"" del a <key> from "gid" folder,
    stored by context.gid.
    **/
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
          service: 'store',
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
     * Usage:
     * the same with store.put
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
          service: 'store',
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
        // get all the nodes
        const oldGroup = Object.values(originalGroup);
        const newGroup = Object.values(v);

        // get all the keys
        distribution[context.gid].store.get(null, (e, v) => {
          if (Object.keys(e).length !== 0) {
            callback(e, null);
            return;
          }

          const oldNids = oldGroup.map((node) => id.getNID(node));
          const newNids = newGroup.map((node) => id.getNID(node));

          // iterate every key
          let needReconf = 0;

          v.forEach((key) => {
            const kid = id.getID(key);
            const oldHash = context.hash(kid, oldNids.slice());
            const newHash = context.hash(kid, newNids.slice());

            // needs relocate
            if (oldHash !== newHash) {
              needReconf += 1;

              // del data in the old node
              oldIdx = oldNids.indexOf(oldHash);
              oldNode = oldGroup[oldIdx];

              const keyWithGid = {
                key: key,
                gid: context.gid,
              };

              const message = [keyWithGid];
              const oldRemote = {
                node: {ip: oldNode.ip, port: oldNode.port},
                service: 'store',
                method: 'del',
              };

              distribution.local.comm.send(message, oldRemote, (e, value) => {
                if (e) {
                  callback(e);
                  return;
                }

                // put the data to the new node
                // the data deleted is store in value
                newIdx = newNids.indexOf(newHash);
                newNode = newGroup[newIdx];

                const keyWithGid = {
                  key: key,
                  gid: context.gid,
                };

                const message = [value, keyWithGid];
                const newRemote = {
                  node: {ip: newNode.ip, port: newNode.port},
                  service: 'store',
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

module.exports = store;
