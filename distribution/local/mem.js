const {id} = require('../util/util');

const mem = {};

global.localMapSet = new Map();
localMapSet.set('local', new Map());

mem.put = function(value, key, callback) {
  callback = callback || function() {};
  let realKey;
  let gid;
  if (typeof key === 'string' || !key) {
    realKey = key || id.getID(value);
    gid = 'local';
  } else {
    realKey = key.key || id.getID(value);
    gid = key.gid;
  }
  let localMap;
  if (global.localMapSet.has(gid)) {
    localMap = global.localMapSet.get(gid);
  } else {
    global.localMapSet.set(gid, new Map());
    localMap = global.localMapSet.get(gid);
  }
  localMap.set(realKey, value);
  console.log(localMap, 'mem-put');
  callback(null, value);
  return;
};

mem.get = function(key, callback) {
  callback = callback || function() {};
  let realKey;
  let gid;
  if (typeof key === 'string' || !key) {
    realKey = key;
    gid = 'local';
  } else {
    realKey = key.key;
    gid = key.gid;
  }
  localMap = global.localMapSet.get(gid);
  if (!localMap) {
    callback(new Error('Local storage not found'), null);
    return;
  }
  if (!realKey) {
    callback(null, [...localMap.keys()]);
    return;
  }
  if (!localMap.has(realKey)) {
    callback(
        new Error(
            `mem.get: Key not find`,
        ),
        null,
    );
    return;
  }
  callback(null, localMap.get(realKey));
  return;
};

mem.del = function(key, callback) {
  callback = callback || function() {};
  let realKey;
  let gid;
  if (typeof key === 'string' || !key) {
    realKey = key;
    gid = 'local';
  } else {
    realKey = key.key;
    gid = key.gid;
  }
  localMap = global.localMapSet.get(gid);
  if (!localMap) {
    callback(new Error('local storage not found'), null);
    return;
  }
  if (!localMap.has(realKey)) {
    callback(new Error('mem.del: key not find'), null);
    return;
  }
  const deletedVal = localMap.get(realKey);
  localMap.delete(realKey);
  callback(null, deletedVal);
  return;
};

mem.append = function(value, key, callback) {
  callback = callback || function() {};
  let realKey;
  let gid;
  if (typeof key === 'string' || !key) {
    realKey = key || id.getID(value);
    gid = 'local';
  } else {
    realKey = key.key || id.getID(value);
    gid = key.gid;
  }
  let localMap;
  if (global.localMapSet.has(gid)) {
    localMap = global.localMapSet.get(gid);
  } else {
    global.localMapSet.set(gid, new Map());
    localMap = global.localMapSet.get(gid);
  }
  if (localMap.has(realKey)) {
    const originalData = localMap.get(realKey);
    let newData;
    if (!Array.isArray(originalData)) {
      newData = [originalData, value];
    } else {
      newData = [...originalData, value];
    }
    localMap.set(realKey, newData);
    callback(null, newData);
    return;
  }
  localMap.set(realKey, [value]);
  callback(null, [value]);
  return;
};

module.exports = mem;
