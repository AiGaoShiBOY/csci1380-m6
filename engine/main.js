const distribution = require('../distribution');
const id = distribution.util.id;
const groupsTemplate = require('../distribution/all/groups');


// meta info
global.nodeConfig = {ip: '127.0.0.1', port: 7011}; // local orchestrator
const nodeNum = 5 // number of nodes in the distributed search engine
let localServer = null; // neede to gracefully shutdown all nodes
let engineGroup = {}
let engineNodes = []
for (let i = 0; i < nodeNum; ++i) {
    let port = 7001 + i;
    let node = {ip: '127.0.0.1', port: port}
    engineGroup[id.getSID(node)] = node
    engineNodes.push(node)
}


// 2: spawn nodes
function spawnNodes(callback) {
    let counter = engineNodes.length
    for (const node of engineNodes) {
        distribution.local.status.spawn(node, (e, v) => {
            if (e) {
                callback(e)
            } else {
                --counter;
                if (counter === 0) {
                    console.log("All nodes have been spawned")
                    callback()
                }
            }
        });
    }
};


// 3: clean up before exiting
function shutdownNodes() {
    let counter = engineNodes.length
    for (const node of engineNodes) {
        let remote = {service: 'status', method: 'stop'};
        remote.node = node;
        distribution.local.comm.send([], remote, (e, v) => {
            --counter;
            if (counter === 0) {
                localServer.close()
                console.log("Everything has been shut down")
            }
        });
    }
}

function startCrawl(cleanup) {
    console.log("TO IMPLEMENT crawl!")
    let remote = {service: 'status', method: 'get'};
    remote.node = engineNodes[0];
    distribution.local.comm.send(['sid'], remote, (e, v) => {
        console.log("RETURNED RESULT: ", e, v)
        cleanup()
    });
}

function main() {
    distribution.node.start((server) => {
        localServer = server;
    
        const engineConfig = {gid: 'engine'};
        spawnNodes((e, v) => {
          groupsTemplate(engineConfig).put(engineConfig, engineGroup, (e, v) => {
            startCrawl(shutdownNodes)
          });
        });
      });
}
main();