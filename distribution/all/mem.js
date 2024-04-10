const {id} = require('../util/util');

const mem = function(config) {
  let context = {};
  context.gid = config.gid || 'all';
  context.hash = config.hash || id.naiveHash;
  let distribution = global.distribution;
  // if (!distribution) {
  //   throw new Error('Distribution not found');
  // }
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
            key: key,
            gid: context.gid,
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
    reconf: function(originalGroup, callback) {
      callback = callback || function() {};
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
