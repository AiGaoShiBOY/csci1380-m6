global.nodeConfig = {ip: '127.0.0.1', port: 8080};
const distribution = require('../distribution');
const id = distribution.util.id;

const groupsTemplate = require('../distribution/all/groups');

// This group is used for testing most of the functionality
const mygroupGroup = {};
// These groups are used for testing hashing
const group1Group = {};
const group2Group = {};
const group3Group = {};
// This group is used for {adding,removing} {groups,nodes}
const group4Group = {};


/*
   This hack is necessary since we can not
   gracefully stop the local listening node.
   This is because the process that node is
   running in is the actual jest process
*/
let localServer = null;

const n1 = {ip: '127.0.0.1', port: 8000};
const n2 = {ip: '127.0.0.1', port: 8001};
const n3 = {ip: '127.0.0.1', port: 8002};
const n4 = {ip: '127.0.0.1', port: 8003};
const n5 = {ip: '127.0.0.1', port: 8004};
const n6 = {ip: '127.0.0.1', port: 8005};

beforeAll((done) => {
  // First, stop the nodes if they are running
  let remote = {service: 'status', method: 'stop'};

  remote.node = n1;
  distribution.local.comm.send([], remote, (e, v) => {
    remote.node = n2;
    distribution.local.comm.send([], remote, (e, v) => {
      remote.node = n3;
      distribution.local.comm.send([], remote, (e, v) => {
        remote.node = n4;
        distribution.local.comm.send([], remote, (e, v) => {
          remote.node = n5;
          distribution.local.comm.send([], remote, (e, v) => {
            remote.node = n6;
            distribution.local.comm.send([], remote, (e, v) => {
            });
          });
        });
      });
    });
  });

  mygroupGroup[id.getSID(n1)] = n1;
  mygroupGroup[id.getSID(n2)] = n2;
  mygroupGroup[id.getSID(n3)] = n3;

  group1Group[id.getSID(n4)] = n4;
  group1Group[id.getSID(n5)] = n5;
  group1Group[id.getSID(n6)] = n6;

  group2Group[id.getSID(n1)] = n1;
  group2Group[id.getSID(n3)] = n3;
  group2Group[id.getSID(n5)] = n5;

  group3Group[id.getSID(n2)] = n2;
  group3Group[id.getSID(n4)] = n4;
  group3Group[id.getSID(n6)] = n6;

  group4Group[id.getSID(n1)] = n1;
  group4Group[id.getSID(n2)] = n2;
  group4Group[id.getSID(n4)] = n4;

  // Now, start the base listening node
  distribution.node.start((server) => {
    localServer = server;

    const groupInstantiation = (e, v) => {
      const mygroupConfig = {gid: 'mygroup'};
      const group1Config = {gid: 'group1', hash: id.naiveHash};
      const group2Config = {gid: 'group2', hash: id.consistentHash};
      const group3Config = {gid: 'group3', hash: id.rendezvousHash};
      const group4Config = {gid: 'group4'};

      // Create some groups
      groupsTemplate(mygroupConfig)
          .put(mygroupConfig, mygroupGroup, (e, v) => {
            groupsTemplate(group1Config)
                .put(group1Config, group1Group, (e, v) => {
                  groupsTemplate(group2Config)
                      .put(group2Config, group2Group, (e, v) => {
                        groupsTemplate(group3Config)
                            .put(group3Config, group3Group, (e, v) => {
                              groupsTemplate(group4Config)
                                  .put(group4Config, group4Group, (e, v) => {
                                    done();
                                  });
                            });
                      });
                });
          });
    };

    // Start the nodes
    distribution.local.status.spawn(n1, (e, v) => {
      distribution.local.status.spawn(n2, (e, v) => {
        distribution.local.status.spawn(n3, (e, v) => {
          distribution.local.status.spawn(n4, (e, v) => {
            distribution.local.status.spawn(n5, (e, v) => {
              distribution.local.status.spawn(n6, groupInstantiation);
            });
          });
        });
      });
    });
  });
});

afterAll((done) => {
  distribution.mygroup.status.stop((e, v) => {
    let remote = {service: 'status', method: 'stop'};
    remote.node = n1;
    distribution.local.comm.send([], remote, (e, v) => {
      remote.node = n2;
      distribution.local.comm.send([], remote, (e, v) => {
        remote.node = n3;
        distribution.local.comm.send([], remote, (e, v) => {
          remote.node = n4;
          distribution.local.comm.send([], remote, (e, v) => {
            remote.node = n5;
            distribution.local.comm.send([], remote, (e, v) => {
              remote.node = n6;
              distribution.local.comm.send([], remote, (e, v) => {
                localServer.close();
                done();
              });
            });
          });
        });
      });
    });
  });
});

// ---all.comm---

test('(4 pts) all.comm.send(status.get(nid))', (done) => {
  const nids = Object.values(mygroupGroup).map((node) => id.getNID(node));
  const remote = {service: 'status', method: 'get'};

  distribution.mygroup.comm.send(['nid'], remote, (e, v) => {
    expect(e).toEqual({});
    try {
      expect(Object.values(v).length).toBe(nids.length);
      expect(Object.values(v)).toEqual(expect.arrayContaining(nids));
      done();
    } catch (error) {
      done(error);
    }
  });
});

test('(2 pts) all.comm.send(status.get(random))', (done) => {
  const remote = {service: 'status', method: 'get'};

  distribution.mygroup.comm.send(['random'], remote, (e, v) => {
    try {
      Object.keys(mygroupGroup).forEach((sid) => {
        expect(e[sid]).toBeDefined();
        expect(e[sid]).toBeInstanceOf(Error);
        expect(v).toEqual({});
      });

      done();
    } catch (error) {
      done(error);
    }
  });
});

// ---all.groups---
test('(2 pts) all.groups.del(random)', (done) => {
  distribution.group4.groups.del('random', (e, v) => {
    try {
      Object.keys(group4Group).forEach((sid) => {
        expect(e[sid]).toBeDefined();
        expect(e[sid]).toBeInstanceOf(Error);
      });
      expect(v).toEqual({});
      done();
    } catch (error) {
      done(error);
    }
  });
});

test('(2 pts) all.groups.put(browncs)', (done) => {
  let g = {
    '507aa': {ip: '127.0.0.1', port: 8080},
    '12ab0': {ip: '127.0.0.1', port: 8081},
  };

  distribution.group4.groups.put('browncsgp', g, (e, v) => {
    try {
      expect(e).toEqual({});
      Object.keys(group4Group).forEach((sid) => {
        expect(v[sid]).toEqual(g);
      });
      done();
    } catch (error) {
      done(error);
    }
  });
});

test('(2 pts) all.groups.put/get(browncs)', (done) => {
  let g = {
    '507aa': {ip: '127.0.0.1', port: 8080},
    '12ab0': {ip: '127.0.0.1', port: 8081},
  };

  distribution.group4.groups.put('browncsgpg', g, (e, v) => {
    distribution.group4.groups.get('browncsgpg', (e, v) => {
      try {
        expect(e).toEqual({});
        Object.keys(group4Group).forEach((sid) => {
          expect(v[sid]).toEqual(g);
        });
        done();
      } catch (error) {
        done(error);
      }
    });
  });
});

test('(2 pts) all.groups.put/get/del(browncs)', (done) => {
  let g = {
    '507aa': {ip: '127.0.0.1', port: 8080},
    '12ab0': {ip: '127.0.0.1', port: 8081},
  };

  distribution.group4.groups.put('browncsgpgd', g, (e, v) => {
    distribution.group4.groups.get('browncsgpgd', (e, v) => {
      distribution.group4.groups.del('browncsgpgd', (e, v) => {
        try {
          expect(e).toEqual({});
          Object.keys(group4Group).forEach((sid) => {
            expect(v[sid]).toEqual(g);
          });
          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });
});

test('(2 pts) all.groups.put/get/del/get(browncs)', (done) => {
  let g = {
    '507aa': {ip: '127.0.0.1', port: 8080},
    '12ab0': {ip: '127.0.0.1', port: 8081},
  };

  distribution.group4.groups.put('browncsgpgdg', g, (e, v) => {
    distribution.group4.groups.get('browncsgpgdg', (e, v) => {
      distribution.group4.groups.del('browncsgpgdg', (e, v) => {
        distribution.group4.groups.get('browncsgpgdg', (e, v) => {
          try {
            expect(e).toBeDefined();
            Object.keys(group4Group).forEach((sid) => {
              expect(e[sid]).toBeInstanceOf(Error);
            });
            expect(v).toEqual({});
            done();
          } catch (error) {
            done(error);
          }
        });
      });
    });
  });
});

test('(2 pts) all.groups.put(dummy)/add(n1)/get(dummy)', (done) => {
  let g = {
    '507aa': {ip: '127.0.0.1', port: 8080},
    '12ab0': {ip: '127.0.0.1', port: 8081},
  };

  distribution.group4.groups.put('dummygpag', g, (e, v) => {
    let n1 = {ip: '127.0.0.1', port: 8082};

    distribution.group4.groups.add('dummygpag', n1, (e, v) => {
      let expectedGroup = {
        ...g, ...{[id.getSID(n1)]: n1},
      };

      distribution.group4.groups.get('dummygpag', (e, v) => {
        try {
          expect(e).toEqual({});
          Object.keys(group4Group).forEach((sid) => {
            expect(v[sid]).toEqual(expectedGroup);
          });
          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });
});

test('(2 pts) all.groups.put(dummy)/rem(n1)/get(dummy)', (done) => {
  let g = {
    '507aa': {ip: '127.0.0.1', port: 8080},
    '12ab0': {ip: '127.0.0.1', port: 8081},
  };

  distribution.group4.groups.put('dummygprg', g, (e, v) => {
    distribution.group4.groups.rem('dummygprg', '507aa', (e, v) => {
      let expectedGroup = {
        '12ab0': {ip: '127.0.0.1', port: 8081},
      };

      distribution.group4.groups.get('dummygprg', (e, v) => {
        try {
          expect(e).toEqual({});
          Object.keys(group4Group).forEach((sid) => {
            expect(v[sid]).toEqual(expectedGroup);
          });
          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });
});

// ---all.routes---

test('(2 pts) all.routes.put(echo)', (done) => {
  const echoService = {};

  echoService.echo = () => {
    return 'echo!';
  };

  distribution.mygroup.routes.put(echoService, 'echo', (e, v) => {
    const n1 = {ip: '127.0.0.1', port: 8000};
    const n2 = {ip: '127.0.0.1', port: 8001};
    const n3 ={ip: '127.0.0.1', port: 8002};
    const r1 = {node: n1, service: 'routes', method: 'get'};
    const r2 = {node: n2, service: 'routes', method: 'get'};
    const r3 = {node: n3, service: 'routes', method: 'get'};

    distribution.local.comm.send(['echo'], r1, (e, v) => {
      try {
        expect(e).toBeFalsy();
        expect(v.echo()).toBe('echo!');
      } catch (error) {
        done(error);
      }
      distribution.local.comm.send(['echo'], r2, (e, v) => {
        try {
          expect(e).toBeFalsy();
          expect(v.echo()).toBe('echo!');
        } catch (error) {
          done(error);
        }
        distribution.local.comm.send(['echo'], r3, (e, v) => {
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
  });
});

// ---all.status---

test('(2 pts) all.status.get(nid)', (done) => {
  const nids = Object.values(mygroupGroup).map((node) => id.getNID(node));

  distribution.mygroup.status.get('nid', (e, v) => {
    try {
      expect(e).toEqual({});
      expect(Object.values(v).length).toBe(nids.length);
      expect(Object.values(v)).toEqual(expect.arrayContaining(nids));
      done();
    } catch (error) {
      done(error);
    }
  });
});

test('(2 pts) all.status.get(random)', (done) => {
  distribution.mygroup.status.get('random', (e, v) => {
    try {
      Object.keys(mygroupGroup).forEach((sid) => {
        expect(e[sid]).toBeDefined();
        expect(e[sid]).toBeInstanceOf(Error);
      });
      expect(v).toEqual({});
      done();
    } catch (error) {
      done(error);
    }
  });
});

test('(2 pts) all.status.spawn/stop()', (done) => {
  // Spawn a node
  const nodeToSpawn = {ip: '127.0.0.1', port: 8008};

  // Spawn the node
  distribution.group4.status.spawn(nodeToSpawn, (e, v) => {
    try {
      expect(e).toBeFalsy();
      expect(v.ip).toEqual(nodeToSpawn.ip);
      expect(v.port).toEqual(nodeToSpawn.port);
    } catch (error) {
      done(error);
    }
    remote = {node: nodeToSpawn, service: 'status', method: 'get'};
    message = [
      'nid', // configuration
    ];

    // Ping the node, it should respond
    distribution.local.comm.send(message, remote, (e, v) => {
      try {
        expect(e).toBeFalsy();
        expect(v).toBe(id.getNID(nodeToSpawn));
      } catch (error) {
        done(error);
      }

      distribution.local.groups.get('group4', (e, v) => {
        try {
          expect(e).toBeFalsy();
          expect(v[id.getSID(nodeToSpawn)]).toBeDefined();
        } catch (error) {
          done(error);
        }

        remote = {node: nodeToSpawn, service: 'status', method: 'stop'};

        // Stop the node
        distribution.local.comm.send([], remote, (e, v) => {
          try {
            expect(e).toBeFalsy();
            expect(v.ip).toEqual(nodeToSpawn.ip);
            expect(v.port).toEqual(nodeToSpawn.port);
          } catch (error) {
            done(error);
          }
          remote = {node: nodeToSpawn, service: 'status', method: 'get'};

          // Ping the node again, it shouldn't respond
          distribution.local.comm.send(message,
              remote, (e, v) => {
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
});

// ---all.gossip---

test('(6 pts) all.gossip.send()', (done) => {
  distribution.mygroup.groups.put('newgroup', {}, (e, v) => {
    let newNode = {ip: '127.0.0.1', port: 4444};
    let message = [
      'newgroup',
      newNode,
    ];

    let remote = {service: 'groups', method: 'add'};
    distribution.mygroup.gossip.send(message, remote, (e, v) => {
      setTimeout(() => {
        distribution.mygroup.groups.get('newgroup', (e, v) => {
          let count = 0;
          for (const k in v) {
            if (Object.keys(v[k]).length > 0) {
              count++;
            }
          }
          /* Gossip only provides weak guarantees */
          try {
            expect(count).toBeGreaterThanOrEqual(2);
            count;
            done();
          } catch (error) {
            done(error);
          }
        });
      }, 500);
    });
  });
});

// // ---Distributed Storage---

// // ---mem---

test('(1 pts) all.mem.put(jcarb)/mygroup.mem.get(jcarb)', (done) => {
  const user = {first: 'John', last: 'Carberry'};
  const key = 'jcarbmpmg';

  distribution.all.mem.put(user, key, (e, v) => {
    distribution.mygroup.mem.get(key, (e, v) => {
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

test('(0.5 pts) all.mem.get(jcarb)', (done) => {
  distribution.mygroup.mem.get('jcarb', (e, v) => {
    try {
      expect(e).toBeInstanceOf(Error);
      expect(v).toBeFalsy();
      done();
    } catch (error) {
      done(error);
    }
  });
});

test('(0.5 pts) all.mem.del(jcarb)', (done) => {
  distribution.mygroup.mem.del('jcarb', (e, v) => {
    try {
      expect(e).toBeInstanceOf(Error);
      expect(v).toBeFalsy();
      done();
    } catch (error) {
      done(error);
    }
  });
});

test('(0.5 pts) all.mem.put(jcarb)', (done) => {
  const user = {first: 'Josiah', last: 'Carberry'};
  const key = 'jcarbmp';

  distribution.mygroup.mem.put(user, key, (e, v) => {
    try {
      expect(e).toBeFalsy();
      expect(v).toEqual(user);
      done();
    } catch (error) {
      done(error);
    }
  });
});

test('(0.5 pts) all.mem.put/get(jcarb)', (done) => {
  const user = {first: 'Josiah', last: 'Carberry'};
  const key = 'jcarbmpg';

  distribution.mygroup.mem.put(user, key, (e, v) => {
    distribution.mygroup.mem.get(key, (e, v) => {
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

test('(0.5 pts) all.mem.put/del(jcarb)', (done) => {
  const user = {first: 'Josiah', last: 'Carberry'};
  const key = 'jcarbmpd';

  distribution.mygroup.mem.put(user, key, (e, v) => {
    distribution.mygroup.mem.del(key, (e, v) => {
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

test('(0.5 pts) all.mem.put/del/get(jcarb)', (done) => {
  const user = {first: 'Josiah', last: 'Carberry'};
  const key = 'jcarbmpdg';

  distribution.mygroup.mem.put(user, key, (e, v) => {
    distribution.mygroup.mem.del(key, (e, v) => {
      distribution.mygroup.mem.get(key, (e, v) => {
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

test('(2.5 pts) all.mem.get(no key)', (done) => {
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

  distribution.mygroup.mem.put(users[0], keys[0], (e, v) => {
    try {
      expect(e).toBeFalsy();
    } catch (error) {
      done(error);
    }
    distribution.mygroup.mem.put(users[1], keys[1], (e, v) => {
      try {
        expect(e).toBeFalsy();
      } catch (error) {
        done(error);
      }
      distribution.mygroup.mem.put(users[2], keys[2], (e, v) => {
        try {
          expect(e).toBeFalsy();
        } catch (error) {
          done(error);
        }
        distribution.mygroup.mem.get(null, (e, v) => {
          try {
            expect(e).toEqual({});
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

test('(0.5 pts) all.mem.put(no key)', (done) => {
  const user = {first: 'Josiah', last: 'Carberry'};

  distribution.mygroup.mem.put(user, null, (e, v) => {
    distribution.mygroup.mem.get(id.getID(user), (e, v) => {
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

// ---store---

test('(1 pts) all.store.put(jcarb)/mygroup.store.get(jcarb)', (done) => {
  const user = {first: 'Josiah', last: 'Carberry'};
  const key = 'jcarbspsg';

  distribution.all.store.put(user, key, (e, v) => {
    distribution.mygroup.store.get(key, (e, v) => {
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

test('(0.5 pts) all.store.get(jcarb)', (done) => {
  distribution.mygroup.store.get('jcarb', (e, v) => {
    try {
      expect(e).toBeInstanceOf(Error);
      expect(v).toBeFalsy();
      done();
    } catch (error) {
      done(error);
    }
  });
});

test('(0.5 pts) all.store.del(jcarb)', (done) => {
  distribution.mygroup.store.del('jcarb', (e, v) => {
    try {
      expect(e).toBeInstanceOf(Error);
      expect(v).toBeFalsy();
      done();
    } catch (error) {
      done(error);
    }
  });
});

test('(0.5 pts) all.store.put(jcarb)', (done) => {
  const user = {first: 'Josiah', last: 'Carberry'};
  const key = 'jcarbmp';

  distribution.mygroup.store.put(user, key, (e, v) => {
    try {
      expect(e).toBeFalsy();
      expect(v).toEqual(user);
      done();
    } catch (error) {
      done(error);
    }
  });
});

test('(0.5 pts) all.store.put/get(jcarb)', (done) => {
  const user = {first: 'Josiah', last: 'Carberry'};
  const key = 'jcarbmpg';

  distribution.mygroup.store.put(user, key, (e, v) => {
    distribution.mygroup.store.get(key, (e, v) => {
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

test('(0.5 pts) all.store.put/del(jcarb)', (done) => {
  const user = {first: 'Josiah', last: 'Carberry'};
  const key = 'jcarbmpd';

  distribution.mygroup.store.put(user, key, (e, v) => {
    distribution.mygroup.store.del(key, (e, v) => {
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

test('(0.5 pts) all.store.put/del/get(jcarb)', (done) => {
  const user = {first: 'Josiah', last: 'Carberry'};
  const key = 'jcarbmpdg';

  distribution.mygroup.store.put(user, key, (e, v) => {
    distribution.mygroup.store.del(key, (e, v) => {
      distribution.mygroup.store.get(key, (e, v) => {
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

test('(2 pts) all.store.get(no key)', (done) => {
  const users = [
    {first: 'Emma', last: 'Watson'},
    {first: 'John', last: 'Krasinski'},
    {first: 'Julie', last: 'Bowen'},
  ];
  const keys = [
    'ewatsonsgnk',
    'jkrasinskisgnk',
    'jbowensgnk',
  ];

  distribution.mygroup.store.put(users[0], keys[0], (e, v) => {
    distribution.mygroup.store.put(users[1], keys[1], (e, v) => {
      distribution.mygroup.store.put(users[2], keys[2], (e, v) => {
        distribution.mygroup.store.get(null, (e, v) => {
          try {
            expect(e).toEqual({});
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

test('(0.5 pts) all.store.put(no key)', (done) => {
  const user = {first: 'Josiah', last: 'Carberry'};

  distribution.mygroup.store.put(user, null, (e, v) => {
    distribution.mygroup.store.get(id.getID(user), (e, v) => {
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


// // ---reconf / correct object placement---

test(
    '(1.5 pts) all.store.put(jcarb)/local.comm.send(store.get(jcarb))',
    (done) => {
      const user = {first: 'Josiah', last: 'Carberry'};
      const key = 'jcarbspcs';
      const kid = id.getID(key);
      const nodes = [n2, n4, n6];
      const nids = nodes.map((node) => id.getNID(node));

      distribution.group3.store.put(user, key, (e, v) => {
        const nid = id.rendezvousHash(kid, nids);
        const pickedNode = nodes.filter((node)=> id.getNID(node) === nid)[0];
        const remote = {node: pickedNode, service: 'store', method: 'get'};
        const message = [{gid: 'group3', key: key}];

        distribution.local.comm.send(message, remote, (e, v) => {
          try {
            expect(e).toBeFalsy();
            expect(v).toEqual(user);
            done();
          } catch (error) {
            done(error);
          }
        });
      });
    },
);

test('(2 pts) all.store.reconf(naiveHash)', (done) => {
  //  ________________________________________
  // / NOTE: If this test fails locally, make \
  // | sure you delete the contents of the    |
  // | store/ directory (not the directory    |
  // | itself!), so your results are          |
  // \ reproducible                           /
  //  ----------------------------------------
  //         \   ^__^
  //          \  (oo)\_______
  //             (__)\       )\/\
  //                 ||----w |
  //                 ||     ||

  // group1 - naiveHash - n4, n5, n6

  // First, we check where the keys should be placed
  // before we change the group's nodes.
  // group1 uses the naiveHash function for item placement,
  // so we test using the same naiveHash function
  const users = [
    {first: 'Emma', last: 'Watson'},
    {first: 'John', last: 'Krasinski'},
    {first: 'Julie', last: 'Bowen'},
    {first: 'Sasha', last: 'Spielberg'},
    {first: 'Tim', last: 'Nelson'},
  ];
  const keys = [
    'ewatsonmrnh',
    'jkrasinskimrnh',
    'jbowenmrnh',
    'sspielbergmrnh',
    'tnelsonmrnh',
  ];
  const kids = keys.map((key) => id.getID(key));
  const nodes = [n4, n5, n6];
  const nids = nodes.map((node) => id.getNID(node));

  const nidsPicked = kids.map((kid) => id.naiveHash(kid, nids));
  const nodesPicked = nidsPicked.map(
      (nid) => nodes.filter((node) => id.getNID(node) === nid)[0],
  );
  // key 0 ends up on n6, while keys 1-4 end up on n4
  // (the following console.logs should confirm that)
  nodesPicked.forEach(
      (node, key) => console.log('BEFORE! key: ', key, 'node: ', node),
  );

  // Then, we remove n5 from the list of nodes,
  // and use the naiveHash function again,
  // to see where items should end up after this change
  const nodesAfter = [n4, n6];
  const nidsAfter = nodesAfter.map((node) => id.getNID(node));

  const nidsPickedAfter = kids.map((kid) => id.naiveHash(kid, nidsAfter));
  const nodesPickedAfter = nidsPickedAfter.map(
      (nid) => nodesAfter.filter((node) => id.getNID(node) === nid)[0],
  );

  // After removal, all keys end up on n6
  // (Again, the console.logs should be consistent with that!)
  nodesPickedAfter.forEach(
      (node, key) => console.log('AFTER! key: ', key, 'node: ', node),
  );

  // This function will be called after we put items in nodes
  const checkPlacement = (e, v) => {
    try {
      const remote = {node: n6, service: 'store', method: 'get'};
      const messages = [
        [{key: keys[0], gid: 'group1'}],
        [{key: keys[1], gid: 'group1'}],
        [{key: keys[2], gid: 'group1'}],
        [{key: keys[3], gid: 'group1'}],
        [{key: keys[4], gid: 'group1'}],
      ];

      distribution.local.comm.send(messages[0], remote, (e, v) => {
        try {
          expect(e).toBeFalsy();
          expect(v).toEqual(users[0]);
        } catch (error) {
          done(error);
        }

        distribution.local.comm.send(messages[1], remote, (e, v) => {
          try {
            expect(e).toBeFalsy();
            expect(v).toEqual(users[1]);
          } catch (error) {
            done(error);
          }

          distribution.local.comm.send(messages[2], remote, (e, v) => {
            try {
              expect(e).toBeFalsy();
              expect(v).toEqual(users[2]);
            } catch (error) {
              done(error);
            }

            distribution.local.comm.send(messages[3], remote, (e, v) => {
              try {
                expect(e).toBeFalsy();
                expect(v).toEqual(users[3]);
              } catch (error) {
                done(error);
              }

              distribution.local.comm.send(messages[4], remote, (e, v) => {
                try {
                  expect(e).toBeFalsy();
                  expect(v).toEqual(users[4]);
                  done();
                } catch (error) {
                  done(error);
                }
              });
            });
          });
        });
      });
    } catch (error) {
      done(error);
    }
  };

  // Now we actually put items in the group,
  // remove n5, and check if the items are placed correctly
  distribution.group1.store.put(users[0], keys[0], (e, v) => {
    distribution.group1.store.put(users[1], keys[1], (e, v) => {
      distribution.group1.store.put(users[2], keys[2], (e, v) => {
        distribution.group1.store.put(users[3], keys[3], (e, v) => {
          distribution.group1.store.put(users[4], keys[4], (e, v)=> {
            // We need to pass a copy of the group's
            // nodes before the changes to reconf()
            const groupCopy = {...group1Group};
            distribution.group1.groups.rem(
                'group1',
                id.getSID(n5),
                (e, v) => {
                  distribution.group1.store.reconf(groupCopy, checkPlacement);
                });
          });
        });
      });
    });
  });
});
