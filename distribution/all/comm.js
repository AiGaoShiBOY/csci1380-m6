let comm = (config) => {
  const context = {};
  context.gid = config.gid || 'all';
  let distribution = global.distribution;
  local = distribution.local;
  return {
    send: (msg, remote, callback) => {
      callback = callback || function () {};
      local.groups.get(context.gid, (e, nodes) => {
        if (e) {
          callback(e);
        } else {
          let errors = {};
          let values = {};
          let counter = Object.keys(nodes).length;
          Object.keys(nodes).forEach((sid) => {
            let n = nodes[sid];
            let r = {
              node: n,
              service: remote.service,
              method: remote.method,
            };
            local.comm.send(msg, r, (e, v) => {
              counter--;
              if (e) {
                errors[sid] = e;
              } else {
                values[sid] = v;
              }
              if (counter === 0) {
                callback(errors, values);
              }
            });
          });
        }
      });
    },
  };
};

module.exports = comm;
