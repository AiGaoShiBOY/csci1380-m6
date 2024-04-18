global.nodeConfig = {ip: '127.0.0.1', port: 8080};
const distribution = require('../distribution');
const id = distribution.util.id;
const fs = require('fs');
const path = require('path');
const util = require('../distribution/util/util');

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

const n1SID = id.getSID(n1);
const n2SID = id.getSID(n2);
const n3SID = id.getSID(n3);
const n4SID = id.getSID(n4);
const n5SID = id.getSID(n5);
const n6SID = id.getSID(n6);

beforeAll((done) => {
  const directoryPath = path.join(__dirname, '../store');

  fs.rmSync(directoryPath, {recursive: true, force: true});

  fs.mkdirSync(directoryPath);

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
            distribution.local.comm.send([], remote, (e, v) => {});
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
      groupsTemplate(mygroupConfig).put(mygroupConfig, mygroupGroup, (e, v) => {
        groupsTemplate(group1Config).put(group1Config, group1Group, (e, v) => {
          groupsTemplate(group2Config).put(
            group2Config,
            group2Group,
            (e, v) => {
              groupsTemplate(group3Config).put(
                group3Config,
                group3Group,
                (e, v) => {
                  groupsTemplate(group4Config).put(
                    group4Config,
                    group4Group,
                    (e, v) => {
                      // crawl the data
                      const pageUrl =
                        'https://www.usenix.org/publications/proceedings?page=345';
                      const msg = [{gid: 'articles'}];
                      const remote = {service: 'store', method: 'get'};
                      distribution.mygroup.crawler.getArticles(
                        pageUrl,
                        (e, v) => {
                          done();
                        },
                      );
                    },
                  );
                },
              );
            },
          );
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

test('test mr', async () => {
  // first read all the data from local store
  const articleKeys = await util.promisify(distribution.mygroup.store.get)({
    gid: 'articles',
  });

  //initialize a default MR config
  const {config1} = require('../distribution/config/config');
  config1.keys = articleKeys;

  const res = await util.promisify(distribution.mygroup.mr.exec)(config1);
  console.log(res);
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
