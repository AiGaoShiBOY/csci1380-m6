const nodeNum = requie('./config').nodeNum;
const distribution = require('../distribution');
const id = distribution.util.id;
const groupsTemplate = require('../distribution/all/groups');

// meta info
global.nodeConfig = {ip: '127.0.0.1', port: 7000}; // local orchestrator
//const nodeNum = 3; // number of nodes in the distributed search engine
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
  distribution.engine.crawler.getPage(
    'https://www.usenix.org/publications/proceedings',
    (e, v) => {
      if (e) {
        console.log(`[crawler.getPage]: ${e}`);
        cleanup();
      }

      // 2. get all the nodes
      distribution.local.groups.get('engine', (e, nodes) => {
        if (e) {
          console.log(`[local.groups.get(engine)]: ${JSON.stringify(e)}`);
          cleanup();
        }

        // 3. for each node, store.get the pages under 'pagesUrl' folder
        // Object.keys(nodes).forEach((node) => {
        for (const node of Object.keys(nodes)) {
          let nodeConfig = nodes[node];
          distribution.local.comm.send(
            [{gid: 'pagesUrl'}],
            {node: nodeConfig, service: 'store', method: 'get'},
            (e, pageKeys) => {
              if (e) {
                console.log(`[local.comm.send(store.get(pagesUrl))] ${e}`);
                cleanup();
              }
              if (pageKeys) {
                // 4. for each page key, retrive the page obj
                pageKeys.forEach((pageKey) => {
                  distribution.local.comm.send(
                    [{key: pageKey, gid: 'pagesUrl'}],
                    {
                      node: nodeConfig,
                      service: 'store',
                      method: 'get',
                    },
                    (e, pageObj) => {
                      if (e) {
                        console.log(
                          `[local.comm.send(store.get(pageKey))]: ${e}`,
                        );
                        cleanup();
                      }
                      if (pageObj) {
                        console.log(
                          `[local.comm.send(store.get(pageKey))]: ${JSON.stringify(
                            pageObj,
                          )}`,
                        );

                        console.log(
                          `before reached getArticles: ${pageObj.url}`,
                        );
                        // 5. crawl the articles from each page
                        distribution.local.comm.send(
                          [pageObj.url],
                          {
                            node: nodeConfig,
                            service: 'crawler',
                            method: 'getArticles',
                          },
                          (e, v) => {
                            // TODO: crawled only one page 119
                            console.log(
                              `after reached getArticles: ${pageObj.url}`,
                            );

                            if (e) {
                              console.log(
                                `[local.comm.send(crawler.getArticles(url))]\n
                              node: ${JSON.stringify(nodeConfig)}\n
                              ${e}`,
                              );
                              cleanup();
                            } else {
                              console.log(v);
                            }
                          },
                        );
                      }
                    },
                  );
                });
              }
            },
          );
        }
        setTimeout(cleanup, 30000) // TODO: shut down the program after 30s
        // );
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
