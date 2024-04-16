const distribution = require('../distribution');
const id = distribution.util.id;
const groupsTemplate = require('../distribution/all/groups');

// meta info
global.nodeConfig = {ip: '127.0.0.1', port: 7011}; // local orchestrator
const nodeNum = 5; // number of nodes in the distributed search engine
let localServer = null; // neede to gracefully shutdown all nodes
let engineGroup = {};
let engineNodes = [];
for (let i = 0; i < nodeNum; ++i) {
  let port = 7001 + i;
  let node = {ip: '127.0.0.1', port: port};
  engineGroup[id.getSID(node)] = node;
  engineNodes.push(node);
}

// 2: spawn nodes
function spawnNodes(callback) {
  let counter = engineNodes.length;
  for (const node of engineNodes) {
    distribution.local.status.spawn(node, (e, v) => {
      if (e) {
        callback(e);
      } else {
        --counter;
        if (counter === 0) {
          console.log('All nodes have been spawned');
          callback();
        }
      }
    });
  }
}

// 3: clean up before exiting
function shutdownNodes() {
  let counter = engineNodes.length;
  for (const node of engineNodes) {
    let remote = {service: 'status', method: 'stop'};
    remote.node = node;
    distribution.local.comm.send([], remote, (e, v) => {
      --counter;
      if (counter === 0) {
        localServer.close();
        console.log('Everything has been shut down');
      }
    });
  }
}

function startCrawl(cleanup) {
  console.log('TO IMPLEMENT crawl!');
  let remote = {service: 'cralwer', method: 'getPage'};
  remote.node = engineNodes[0];
  // 1. crawl and store the pages on disk
  distribution.local.comm.send(
      ['https://www.usenix.org/publications/proceedings'],
      remote,
      (e, v) => {
        console.log(
            `WARNING: do not use the values in the callback function.
             It is only designed for tests.`,
        );
        console.log(
            `[crawler.getPage] error: ${JSON.stringify(e)}; 
            value: ${JSON.stringify(v)}`,
        );
        // 2. get all the nodes
        distribution.local.groups.get('all', (e, nodes) => {
          Object.keys(nodes).forEach((node) => {
            let nodeConfig = nodes[node];
            // 3. for each node, store.get the pages under 'pagesUrl' folder
            console.log(`[TODO]: MODIFY THE KEY IN comm.send`);
            distribution.local.comm.send(
                [{gid: 'pagesUrl'}],
                // TODO: need to sync with store.get logic with [flexGid]
                {node: nodeConfig, service: 'store', method: 'get'},
                (e, pages) => {
                  // example: {page: 1, url: https://www.usenix.org/publications/proceedings?page=1}
                  // 4. crawl and store the articles on disk for each page
                  console.log(
                      `[store.get] error: ${JSON.stringify(
                          e,
                      )}; value: ${JSON.stringify(v)}`,
                  );
                  pages.forEach((pageObj) => {
                    distribution.local.comm.send(
                        [pageObj.url],
                        {
                          node: nodeConfig,
                          service: 'crawler',
                          method: 'getArticles',
                        },
                        (e, v) => {
                          console.log(
                              `[crawler.getArticles] error: ${JSON.stringify(
                                  e,
                              )}; value: ${JSON.stringify(v)}`,
                          );
                          console.log('CRAWLING IS DONEEEE!!! CONGRATS!!!');
                          cleanup();
                        },
                    );
                  });
                },
            );
          });
        });
      },
  );
}

function main() {
  distribution.node.start((server) => {
    localServer = server;

    const engineConfig = {gid: 'engine'};
    spawnNodes((e, v) => {
      groupsTemplate(engineConfig).put(engineConfig, engineGroup, (e, v) => {
        startCrawl(shutdownNodes);
      });
    });
  });
}
main();
