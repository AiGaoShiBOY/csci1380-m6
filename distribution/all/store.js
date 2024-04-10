const {id} = require('../util/util');
const fs = require('fs');
const path = require('path');

const store = function(config) {
  let context = {};
  context.gid = config.gid || 'all';
  context.hash = config.hash || id.naiveHash;
  let distribution = global.distribution;
  if (!distribution) {
    throw new Error('Distribution not found');
  }

  const baseFolderPath = path
      .join(__dirname, '../../store', 's-' + id.getSID(global.nodeConfig));
  if (!fs.existsSync(baseFolderPath)) {
    fs.mkdirSync(baseFolderPath);
  }

  const groupPath = path.join(baseFolderPath, context.gid);
  if (!fs.existsSync(groupPath)) {
    fs.mkdirSync(groupPath);
  }


  return {
    put: function(value, key, callback) {
      callback = callback || function() {};
      distribution.local.groups.get(context.gid, (e, v) => {
        if (e) {
          callback(e, null);
          return;
        }
        // get all the nodes
        const nodesArray = Object.values(v);
        const nids = nodesArray.map((node) => id.getNID(node));

        // get the hash of the value
        // if the key is null, do multiple hash;
        if (!key) {
          key = id.getID(value);
        }
        const kid = id.getID(key);
        const expectedHash = context.hash(kid, nids.slice());

        const targetIdx = nids.indexOf(expectedHash);
        const targetNode = nodesArray[targetIdx];

        const keyWithGid = {
          key: key,
          gid: context.gid,
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
    get: function(key, callback) {
      callback = callback || function() {};
      distribution.local.groups.get(context.gid, (e, v) => {
        if (e) {
          callback(e, null);
          return;
        }

        if (key) {
          // get all the nodes
          const nodesArray = Object.values(v);
          const nids = nodesArray.map((node) => id.getNID(node));

          // get the hash of the value
          const kid = id.getID(key);
          const expectedHash = context.hash(kid, nids.slice());

          const targetIdx = nids.indexOf(expectedHash);
          const targetNode = nodesArray[targetIdx];

          let keyWithGid;

          if (typeof key === 'string') {
            keyWithGid = {
              key: key,
              gid: context.gid,
            };
          } else {
            keyWithGid = key;
          }
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
            key: key,
            gid: context.gid,
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
    del: function(key, callback) {
      callback = callback || function() {};
      distribution.local.groups.get(context.gid, (e, v) => {
        if (e) {
          callback(e, null);
          return;
        }
        // get all the nodes
        const nodesArray = Object.values(v);
        const nids = nodesArray.map((node) => id.getNID(node));

        // get the hash of the value
        const kid = id.getID(key);
        const expectedHash = context.hash(kid, nids.slice());

        const targetIdx = nids.indexOf(expectedHash);
        const targetNode = nodesArray[targetIdx];


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
    // note this append also support passing a key like {key: key, gid: gid}
    append: function(value, key, callback) {
      callback = callback || function() {};
      distribution.local.groups.get(context.gid, (e, v) => {
        if (e) {
          callback(e, null);
          return;
        }
        // get all the nodes
        const nodesArray = Object.values(v);
        const nids = nodesArray.map((node) => id.getNID(node));

        // get the hash of the value
        // if the key is null, do multiple hash;
        if (!key) {
          key = id.getID(value);
        }
        const kid = id.getID(key);
        const expectedHash = context.hash(kid, nids.slice());

        const targetIdx = nids.indexOf(expectedHash);
        const targetNode = nodesArray[targetIdx];

        let keyWithGid;

        if (typeof key === 'string') {
          keyWithGid = {
            key: key,
            gid: context.gid,
          };
        } else {
          keyWithGid = key;
        }
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
    reconf: function(originalGroup, callback) {
      callback = callback || function() {};
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
