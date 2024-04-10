const {oracle} = require('./oracle');
const fs = require('fs');
const path = require('path');

let distribution;
let local;

let routes;
let comm;
let status;

let id;
let node;

let lastPort = 8090;

// Auxiliary files
const fileNames = [
  'naiveHashAux1.txt',
  'consistentHashAux1.txt',
  'rendezvousHashAux1.txt',
].map((fileName) => path.join(__dirname, fileName));

const cleanup = () => {
  // Deletes auxiliary files (if any)
  for (const fileName of fileNames) {
    if (fs.existsSync(fileName)) {
      fs.unlinkSync(fileName);
    }
  }
};

beforeAll((done) => {
  cleanup();
  done();
});

afterAll((done) => {
  cleanup();
  done();
});

beforeEach(() => {
  jest.resetModules();

  global.nodeConfig = {
    ip: '127.0.0.1',
    port: lastPort++, // Avoid port conflicts
  };

  distribution = require('../distribution');
  local = distribution.local;

  id = distribution.util.id;
  wire = distribution.util.wire;

  node = global.nodeConfig;

  routes = local.routes;
  comm = local.comm;
  status = local.status;
});

// ---STATUS---

test('(2 pts) local.status.get(sid)', (done) => {
  local.status.get('sid', (e, v) => {
    try {
      expect(e).toBeFalsy();
      expect(v).toBe(id.getSID(node));
      done();
    } catch (error) {
      done(error);
    }
  });
});

test('(2 pts) local.status.get(ip)', (done) => {
  local.status.get('ip', (e, v) => {
    try {
      expect(e).toBeFalsy();
      expect(v).toBe(node.ip);
      done();
    } catch (error) {
      done(error);
    }
  });
});

test('(2 pts) local.status.get(port)', (done) => {
  local.status.get('port', (e, v) => {
    try {
      expect(e).toBeFalsy();
      expect(v).toBe(node.port);
      done();
    } catch (error) {
      done(error);
    }
  });
});

test('(2 pts) local.status.get(counts)', (done) => {
  local.status.get('counts', (e, v) => {
    try {
      expect(e).toBeFalsy();
      expect(v).toBeDefined();
      done();
    } catch (error) {
      done(error);
    }
  });
});

test('(2 pts) local.status.get(random)', (done) => {
  local.status.get('random', (e, v) => {
    try {
      expect(e).toBeDefined();
      expect(e).toBeInstanceOf(Error);
      expect(v).toBeFalsy();
      done();
    } catch (error) {
      done(error);
    }
  });
});

// ---ROUTES---

test('(4 pts) local.routes.get(status)', (done) => {
  local.routes.get('status', (e, v) => {
    try {
      expect(e).toBeFalsy();
      expect(v).toBe(status);
      done();
    } catch (error) {
      done(error);
    }
  });
});

test('(4 pts) local.routes.get(routes)', (done) => {
  local.routes.get('routes', (e, v) => {
    try {
      expect(e).toBeFalsy();
      expect(v).toBe(routes);
      done();
    } catch (error) {
      done(error);
    }
  });
});

test('(4 pts) local.routes.get(comm)', (done) => {
  local.routes.get('comm', (e, v) => {
    try {
      expect(e).toBeFalsy();
      expect(v).toBe(comm);
      done();
    } catch (error) {
      done(error);
    }
  });
});

test('(4 pts) local.routes.get(random)', (done) => {
  local.routes.get('random', (e, v) => {
    try {
      expect(e).toBeDefined();
      expect(e).toBeInstanceOf(Error);
      expect(v).toBeFalsy();
      done();
    } catch (error) {
      done(error);
    }
  });
});

test('(8 pts) local.routes.put/get(echo)', (done) => {
  const echoService = {};

  echoService.echo = () => {
    return 'echo!';
  };

  local.routes.put(echoService, 'echo', (e, v) => {
    local.routes.get('echo', (e, v) => {
      try {
        expect(e).toBeFalsy();
        expect(v.echo()).toBe('echo!');
        done();
      } catch (error) {
        done(error);
      }
    });
  });
});

// ---COMM---

test('(10 pts) local.comm(status.get(nid))', (done) => {
  remote = {node: node, service: 'status', method: 'get'};
  message = [
    'nid', // configuration
  ];

  distribution.node.start((server) => {
    local.comm.send(message, remote, (e, v) => {
      server.close();
      try {
        expect(e).toBeFalsy();
        expect(v).toBe(id.getNID(node));
        done();
      } catch (error) {
        done(error);
      }
    });
  });
});

test('(9 pts) RPC1', (done) => {
  let n = 0;

  const addOne = () => {
    return ++n;
  };

  const addOneRPC = distribution.util.wire.createRPC(
      distribution.util.wire.toAsync(addOne));

  const rpcService = {
    addOneRPC: addOneRPC,
  };

  distribution.node.start((server) => {
    local.routes.put(rpcService, 'rpcService', (e, v) => {
      local.routes.get('rpcService', (e, s) => {
        try {
          expect(e).toBeFalsy();
        } catch (error) {
          done(error);
        }
        s.addOneRPC((e, v) => {
          s.addOneRPC((e, v) => {
            s.addOneRPC((e, v) => {
              server.close();
              try {
                expect(e).toBeFalsy();
                expect(v).toBe(3);
                done();
              } catch (error) {
                done(error);
              }
            });
          });
        });
      });
    });
  });
});

// // ---LOCAL.GROUPS---

test('(2 pts) local.groups.get(random)', (done) => {
  distribution.local.groups.get('random', (e, v) => {
    try {
      expect(e).toBeDefined();
      expect(e).toBeInstanceOf(Error);
      expect(v).toBeFalsy();
      done();
    } catch (error) {
      done(error);
    }
  });
});

test('(2 pts) local.groups.del(random)', (done) => {
  distribution.local.groups.del('random', (e, v) => {
    try {
      expect(e).toBeDefined();
      expect(e).toBeInstanceOf(Error);
      expect(v).toBeFalsy();
      done();
    } catch (error) {
      done(error);
    }
  });
});

test('(2 pts) local.groups.put(browncs)', (done) => {
  let g = {
    '507aa': {ip: '127.0.0.1', port: 8080},
    '12ab0': {ip: '127.0.0.1', port: 8081},
  };

  distribution.local.groups.put('browncs', g, (e, v) => {
    try {
      expect(e).toBeFalsy();
      expect(v).toBe(g);
      done();
    } catch (error) {
      done(error);
    }
  });
});

test('(2 pts) local.groups.put/get(browncs)', (done) => {
  let g = {
    '507aa': {ip: '127.0.0.1', port: 8080},
    '12ab0': {ip: '127.0.0.1', port: 8081},
  };

  distribution.local.groups.put('browncs', g, (e, v) => {
    distribution.local.groups.get('browncs', (e, v) => {
      try {
        expect(e).toBeFalsy();
        expect(v).toBe(g);
        done();
      } catch (error) {
        done(error);
      }
    });
  });
});

test('(2 pts) local.groups.put/get/del(browncs)', (done) => {
  let g = {
    '507aa': {ip: '127.0.0.1', port: 8080},
    '12ab0': {ip: '127.0.0.1', port: 8081},
  };

  distribution.local.groups.put('browncs', g, (e, v) => {
    distribution.local.groups.get('browncs', (e, v) => {
      distribution.local.groups.del('browncs', (e, v) => {
        try {
          expect(e).toBeFalsy();
          expect(v).toBe(g);
          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });
});

test('(2 pts) local.groups.put/get/del/get(browncs)', (done) => {
  let g = {
    '507aa': {ip: '127.0.0.1', port: 8080},
    '12ab0': {ip: '127.0.0.1', port: 8081},
  };

  distribution.local.groups.put('browncs', g, (e, v) => {
    distribution.local.groups.get('browncs', (e, v) => {
      distribution.local.groups.del('browncs', (e, v) => {
        distribution.local.groups.get('browncs', (e, v) => {
          try {
            expect(e).toBeDefined();
            expect(e).toBeInstanceOf(Error);
            expect(v).toBeFalsy();
            done();
          } catch (error) {
            done(error);
          }
        });
      });
    });
  });
});

test('(2 pts) local.groups.put(dummy)/add(n1)/get(dummy)', (done) => {
  const g = {
    '507aa': {ip: '127.0.0.1', port: 8080},
    '12ab0': {ip: '127.0.0.1', port: 8081},
  };

  distribution.local.groups.put('dummy', g, (e, v) => {
    const n1 = {ip: '127.0.0.1', port: 8082};

    distribution.local.groups.add('dummy', n1, (e, v) => {
      const expectedGroup = {
        ...g, ...{[id.getSID(n1)]: n1},
      };

      distribution.local.groups.get('dummy', (e, v) => {
        try {
          expect(e).toBeFalsy();
          expect(v).toEqual(expectedGroup);
          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });
});

test('(2 pts) local.groups.put(dummy)/rem(n1)/get(dummy)', (done) => {
  const g = {
    '507aa': {ip: '127.0.0.1', port: 8080},
    '12ab0': {ip: '127.0.0.1', port: 8081},
  };

  distribution.local.groups.put('dummy', g, (e, v) => {
    distribution.local.groups.rem('dummy', '507aa', (e, v) => {
      const expectedGroup = {
        '12ab0': {ip: '127.0.0.1', port: 8081},
      };

      distribution.local.groups.get('dummy', (e, v) => {
        try {
          expect(e).toBeFalsy();
          expect(v).toEqual(expectedGroup);
          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });
});

// ---Local Storage---

// ---mem---

test('(0.5 pts) local.mem.get(jcarb)', (done) => {
  const key = 'jcarbmg';

  distribution.local.mem.get(key, (e, v) => {
    try {
      expect(e).toBeInstanceOf(Error);
      expect(v).toBeFalsy();
      done();
    } catch (error) {
      done(error);
    }
  });
});

test('(0.5 pts) local.mem.del(jcarb)', (done) => {
  const key = 'jcarbmd';

  distribution.local.mem.del(key, (e, v) => {
    try {
      expect(e).toBeInstanceOf(Error);
      expect(v).toBeFalsy();
      done();
    } catch (error) {
      done(error);
    }
  });
});

test('(0.5 pts) local.mem.put(jcarb)', (done) => {
  const user = {first: 'Josiah', last: 'Carberry'};
  const key = 'jcarbmp';

  distribution.local.mem.put(user, key, (e, v) => {
    try {
      expect(e).toBeFalsy();
      expect(v).toBe(user);
      done();
    } catch (error) {
      done(error);
    }
  });
});

test('(0.5 pts) local.mem.put/get(jcarb)', (done) => {
  const user = {first: 'Josiah', last: 'Carberry'};
  const key = 'jcarbmpg';

  distribution.local.mem.put(user, key, (e, v) => {
    distribution.local.mem.get(key, (e, v) => {
      try {
        expect(e).toBeFalsy();
        expect(v).toBe(user);
        done();
      } catch (error) {
        done(error);
      }
    });
  });
});

test('(0.5 pts) local.mem.put/del(jcarb)', (done) => {
  const user = {first: 'Josiah', last: 'Carberry'};
  const key = 'jcarbmpd';

  distribution.local.mem.put(user, key, (e, v) => {
    distribution.local.mem.del(key, (e, v) => {
      try {
        expect(e).toBeFalsy();
        expect(v).toBe(user);
        done();
      } catch (error) {
        done(error);
      }
    });
  });
});

test('(0.5 pts) local.mem.put/del/get(jcarb)', (done) => {
  const user = {first: 'Josiah', last: 'Carberry'};
  const key = 'jcarbmpdg';

  distribution.local.mem.put(user, key, (e, v) => {
    distribution.local.mem.del(key, (e, v) => {
      distribution.local.mem.get(key, (e, v) => {
        try {
          expect(e).toBeInstanceOf(Error);
          expect(v).toBeFalsy();
          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });
});

test('(2 pts) local.mem.get(no key)', (done) => {
  const users = [
    {first: 'Emma', last: 'Watson'},
    {first: 'John', last: 'Krasinski'},
    {first: 'Julie', last: 'Bowen'},
  ];
  const keys = [
    'ewatson',
    'jkrasinski',
    'jbowen',
  ];

  distribution.local.mem.put(users[0], keys[0], (e, v) => {
    distribution.local.mem.put(users[1], keys[1], (e, v) => {
      distribution.local.mem.put(users[2], keys[2], (e, v) => {
        distribution.local.mem.get(null, (e, v) => {
          try {
            expect(e).toBeFalsy();
            expect(Object.values(v)).toEqual(expect.arrayContaining(keys));
            done();
          } catch (error) {
            done(error);
          }
        });
      });
    });
  });
});

test('(0.5 pts) local.mem.put(no key)', (done) => {
  const user = {first: 'Josiah', last: 'Carberry'};

  distribution.local.mem.put(user, null, (e, v) => {
    distribution.local.mem.get(id.getID(user), (e, v) => {
      try {
        expect(e).toBeFalsy();
        expect(v).toBe(user);
        done();
      } catch (error) {
        done(error);
      }
    });
  });
});


// ---store---

test('(0.5 pts) local.store.get(jcarb)', (done) => {
  const key = 'jcarbsg';

  distribution.local.store.get(key, (e, v) => {
    try {
      expect(e).toBeInstanceOf(Error);
      expect(v).toBeFalsy();
      done();
    } catch (error) {
      done(error);
    }
  });
});

test('(0.5 pts) local.store.del(jcarb)', (done) => {
  const key = 'jcarbsd';

  distribution.local.store.del(key, (e, v) => {
    try {
      expect(e).toBeInstanceOf(Error);
      expect(v).toBeFalsy();
      done();
    } catch (error) {
      done(error);
    }
  });
});

test('(0.5 pts) local.store.put(jcarb)', (done) => {
  const user = {first: 'Josiah', last: 'Carberry'};
  const key = 'jcarbsp';

  distribution.local.store.put(user, key, (e, v) => {
    try {
      expect(e).toBeFalsy();
      expect(v).toBe(user);
      done();
    } catch (error) {
      done(error);
    }
  });
});

test('(0.5 pts) local.store.put/get(jcarb)', (done) => {
  const user = {first: 'Josiah', last: 'Carberry'};
  const key = 'jcarbspg';

  distribution.local.store.put(user, key, (e, v) => {
    distribution.local.store.get(key, (e, v) => {
      try {
        expect(e).toBeFalsy();
        expect(v).toEqual(user);
        done();
      } catch (error) {
        done(error);
      }
    });
  });
});

test('(0.5 pts) local.store.put/del(jcarb)', (done) => {
  const user = {first: 'Josiah', last: 'Carberry'};
  const key = 'jcarbspd';

  distribution.local.store.put(user, key, (e, v) => {
    distribution.local.store.del(key, (e, v) => {
      try {
        expect(e).toBeFalsy();
        expect(v).toEqual(user);
        done();
      } catch (error) {
        done(error);
      }
    });
  });
});

test('(0.5 pts) local.store.put/del/get(jcarb)', (done) => {
  const user = {first: 'Josiah', last: 'Carberry'};
  const key = 'jcarbspdg';

  distribution.local.store.put(user, key, (e, v) => {
    distribution.local.store.del(key, (e, v) => {
      distribution.local.store.get(key, (e, v) => {
        try {
          expect(e).toBeInstanceOf(Error);
          expect(v).toBeFalsy();
          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });
});

test('(2 pts) local.store.get(no key)', (done) => {
  const users = [
    {first: 'Emma', last: 'Watson'},
    {first: 'John', last: 'Krasinski'},
    {first: 'Julie', last: 'Bowen'},
  ];
  const keys = [
    'ewatson',
    'jkrasinski',
    'jbowen',
  ];

  distribution.local.store.put(users[0], keys[0], (e, v) => {
    distribution.local.store.put(users[1], keys[1], (e, v) => {
      distribution.local.store.put(users[2], keys[2], (e, v) => {
        distribution.local.store.get(null, (e, v) => {
          try {
            expect(e).toBeFalsy();
            expect(Object.values(v)).toEqual(expect.arrayContaining(keys));
            done();
          } catch (error) {
            done(error);
          }
        });
      });
    });
  });
});

test('(0.5 pts) local.store.put(no key)', (done) => {
  const user = {first: 'Josiah', last: 'Carberry'};

  distribution.local.store.put(user, null, (e, v) => {
    distribution.local.store.get(id.getID(user), (e, v) => {
      try {
        expect(e).toBeFalsy();
        expect(v).toEqual(user);
        done();
      } catch (error) {
        done(error);
      }
    });
  });
});

// ---Hashing---

test('(2 pts) naiveHash() - 1', (done) => {
  const key = 'jcarb';
  const nodes = [
    {ip: '127.0.0.1', port: 10000},
    {ip: '127.0.0.1', port: 10001},
    {ip: '127.0.0.1', port: 10002},
  ];

  const kid = id.getID(key);
  const nids = nodes.map((node) => id.getNID(node));

  const hash = id.naiveHash(kid, nids);

  // oracle is used to test correctness
  const expectedHash = oracle('naiveHash', kid, nids, 1);

  try {
    expect(expectedHash).toBeTruthy();
    expect(hash).toBe(expectedHash);
    done();
  } catch (error) {
    done(error);
  }
});

test('(2 pts) consistentHash() - 1', (done) => {
  const key = 'jcarb';
  const nodes = [
    {ip: '127.0.0.1', port: 10000},
    {ip: '127.0.0.1', port: 10001},
    {ip: '127.0.0.1', port: 10002},
  ];

  const kid = id.getID(key);
  const nids = nodes.map((node) => id.getNID(node));

  const hash = id.consistentHash(kid, nids);

  // oracle is used to test correctness
  const expectedHash = oracle('consistentHash', kid, nids, 1);

  try {
    expect(expectedHash).toBeTruthy();
    expect(hash).toBe(expectedHash);
    done();
  } catch (error) {
    done(error);
  }
});

test('(2 pts) rendezvousHash() - 1', (done) => {
  const key = 'jcarb';
  const nodes = [
    {ip: '127.0.0.1', port: 10000},
    {ip: '127.0.0.1', port: 10001},
    {ip: '127.0.0.1', port: 10002},
  ];

  const kid = id.getID(key);
  const nids = nodes.map((node) => id.getNID(node));

  const hash = id.rendezvousHash(kid, nids);

  // oracle is used to test correctness
  const expectedHash = oracle('rendezvousHash', kid, nids, 1);

  try {
    expect(expectedHash).toBeTruthy();
    expect(hash).toBe(expectedHash);
    done();
  } catch (error) {
    done(error);
  }
});
