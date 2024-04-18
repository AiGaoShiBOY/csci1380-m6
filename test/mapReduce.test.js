global.nodeConfig = {ip: '127.0.0.1', port: 8080};
const distribution = require('../distribution');
const id = distribution.util.id;
const fs = require('fs');
const path = require('path');
const util = require('../distribution/util/util');

const groupsTemplate = require('../distribution/all/groups');

// This group is used for testing most of the functionality
const mygroupGroup = {};

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

  // clean up the storage
  const directoryPath = path.join(__dirname, '../store');
  fs.rmSync(directoryPath, {recursive: true, force: true});
  fs.mkdirSync(directoryPath);

  // initialize the groups
  mygroupGroup[id.getSID(n1)] = n1;
  mygroupGroup[id.getSID(n2)] = n2;
  mygroupGroup[id.getSID(n3)] = n3;

  // Now, start the base listening node
  distribution.node.start(async (server) => {
    try {
      localServer = server;
      // start the nodes
      const localSpawnAsync = util.promisify(distribution.local.status.spawn);
      await localSpawnAsync(n1);
      await localSpawnAsync(n2);
      await localSpawnAsync(n3);

      // initialize the groups
      const mygroupConfig = {gid: 'mygroup'};
      await util.promisify(groupsTemplate(mygroupConfig).put)(
        mygroupConfig,
        mygroupGroup,
      );

      // crawl the data
      const pageUrl =
        'https://www.usenix.org/publications/proceedings?page=345';
      const msg = [{gid: 'articles'}];
      const remote = {service: 'store', method: 'get'};
      const v = await util.promisify(distribution.mygroup.crawler.getArticles)(
        pageUrl,
      );
      console.log(v);

      // you can go for map reduce!
      done();
    } catch (e) {
      console.log(e);
      done(e);
    }
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
          localServer.close();
          done();
        });
      });
    });
  });
});

// test mr
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
