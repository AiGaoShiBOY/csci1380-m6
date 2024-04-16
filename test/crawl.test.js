global.nodeConfig = {ip: '127.0.0.1', port: 8080};
const distribution = require('../distribution');
const id = distribution.util.id;
const fs = require('fs');
const path = require('path');
const {log} = require('../distribution/util/util');

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
                      done();
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

// after initialisation
// ------ crawler test
test('all.crawler.getPage(baseurl)', (done) => {
  const baseUrl = 'https://www.usenix.org/publications/proceedings';
  const msg = [{gid: 'pagesUrl'}];
  const remote = {service: 'store', method: 'get'};

  distribution.mygroup.crawler.getPage(baseUrl, (e, v) => {
    try {
      expect(e).toBeFalsy();
    } catch (error) {
      done(error);
    }
    distribution.mygroup.comm.send(msg, remote, (e, v) => {
      try {
        const n1Cnt = Object.keys(v[id.getSID(n1)]).length;
        const n2Cnt = Object.keys(v[id.getSID(n2)]).length;
        const n3Cnt = Object.keys(v[id.getSID(n3)]).length;
        const totalCnt = n1Cnt + n2Cnt + n3Cnt;
        expect(e).toEqual({});
        expect(totalCnt).toEqual(345);
      } catch (error) {
        done(error);
      }
    });
    done();
  });
});

test('all.crawler.getArticle(articleUrl) w/ abstract', (done) => {
  const articleurl =
    'https://www.usenix.org/conference/usenixsecurity24/presentation/cheng-xiaoyu';
  const article = [
    {text: "USENIX Security '24", href: 'conference/usenixsecurity24'},
    {
      text: 'SpecLFB: Eliminating Cache Side Channels in Speculative Executions',
      href: '/conference/usenixsecurity24/presentation/cheng-xiaoyu',
    },
    {text: ''},
  ];
  const expected = {
    conference: "USENIX Security '24",
    title: 'SpecLFB: Eliminating Cache Side Channels in Speculative Executions',
    authors:
      'Xiaoyu Cheng, School of Cyber Science and Engineering, Southeast University, Nanjing, Jiangsu, China; Jiangsu Province Engineering Research Center of Security for Ubiquitous Network, China; Fei Tong, School of Cyber Science and Engineering, Southeast University, Nanjing, Jiangsu, China; Jiangsu Province Engineering Research Center of Security for Ubiquitous Network, China; Purple Mountain Laboratories, Nanjing, Jiangsu, China; Hongyu Wang, State Key Laboratory of Power Equipment Technology, School of Electrical Engineering, Chongqing University, China; Wiscom System Co., LTD, Nanjing, China; Zhe Zhou and Fang Jiang, School of Cyber Science and Engineering, Southeast University, Nanjing, Jiangsu, China; Jiangsu Province Engineering Research Center of Security for Ubiquitous Network, China; Yuxing Mao, State Key Laboratory of Power Equipment Technology, School of Electrical Engineering, Chongqing University, China',
    abstract:
      'Cache side-channel attacks based on speculative executions are powerful and difficult to mitigate. Existing hardware defense schemes often require additional hardware data structures, data movement operations and/or complex logical computations, resulting in excessive overhead of both processor performance and hardware resources. To this end, this paper proposes SpecLFB, which utilizes the microarchitecture component, Line-Fill-Buffer, integrated with a proposed mechanism for load security check to prevent the establishment of cache side channels in speculative executions. To ensure the correctness and immediacy of load security check, a structure called ROB unsafe mask is designed for SpecLFB to track instruction state. To further reduce processor performance overhead, SpecLFB narrows down the protection scope of unsafe speculative loads and determines the time at which they can be deprotected as early as possible. SpecLFB has been implemented in the open-source RISC-V core, SonicBOOM, as well as in Gem5. For the enhanced SonicBOOM, its register-transfer-level (RTL) code is generated, and an FPGA hardware prototype burned with the core and running a Linux-kernel-based operating system is developed. Based on the evaluations in terms of security guarantee, performance overhead, and hardware resource overhead through RTL simulation, FPGA prototype experiment, and Gem5 simulation, it shows that SpecLFB effectively defends against attacks. It leads to a hardware resource overhead of only 0.6% and the performance overhead of only 1.85% and 3.20% in the FPGA prototype experiment and Gem5 simulation, respectively.',
  };
  distribution.mygroup.crawler.getArticle(articleurl, article, (e, v) => {
    expect(e).toBeFalsy();
    expect(v).toEqual(expected);
    done();
  });
});

test('all.crawler.getArticle(articleUrl) w/o abstract', (done) => {
  const articleurl =
    'https://www.usenix.org/conference/usenix-mach-symposium/how-design-reliable-servers-using-fault-tolerant-micro-kernel';
  const article = [
    {text: 'USENIX Mach Symposium', href: '/conference/usenixmachsymposium'},
    {
      text: 'How to Design Reliable Servers using Fault Tolerant Micro-Kernel Mechanisms',
      href: '/conference/usenix-mach-symposium/how-design-reliable-servers-using-fault-tolerant-micro-kernel',
    },
    {text: 'Michel Banâtre, Gilles Muller, Pack Heng, Bruno Rochat'},
  ];
  const expected = {
    conference: 'USENIX Mach Symposium',
    title:
      'How to Design Reliable Servers using Fault Tolerant Micro-Kernel Mechanisms',
    authors:
      'Michel Banatre and Gilles Muller, IRISA/INRlA; Pack Heng and Bruno Rochat, BULL Research',
    abstract: '',
  };
  distribution.mygroup.crawler.getArticle(articleurl, article, (e, v) => {
    expect(e).toBeFalsy();
    expect(v).toEqual(expected);
    done();
  });
});

test('all.crawler.getArticles(pageUrl)', (done) => {
  const pageUrl = 'https://www.usenix.org/publications/proceedings?page=345';
  const msg = [{gid: 'articles'}];
  const remote = {service: 'store', method: 'get'};

  distribution.mygroup.crawler.getArticles(pageUrl, (e, v) => {
    try {
      expect(e).toBeFalsy();
    } catch (error) {
      done(error);
    }
    distribution.mygroup.comm.send(msg, remote, (e, v) => {
      log(JSON.stringify(v));
      let n1Cnt = 0;
      let n2Cnt = 0;
      let n3Cnt = 0;
      let n4Cnt = 0;
      let n5Cnt = 0;
      let n6Cnt = 0;
      try {
        if (v.hasOwnProperty(n1SID)) {
          n1Cnt = v[n1SID].length;
        }
        if (v.hasOwnProperty(n2SID)) {
          n2Cnt = v[n2SID].length;
        }
        if (v.hasOwnProperty(n3SID)) {
          n3Cnt = v[n3SID].length;
        }
        if (v.hasOwnProperty(n4SID)) {
          n4Cnt = v[n4SID].length;
        }
        if (v.hasOwnProperty(n5SID)) {
          n5Cnt = v[n5SID].length;
        }
        if (v.hasOwnProperty(n6SID)) {
          n6Cnt = v[n6SID].length;
        }
        const totalCnt = n1Cnt + n2Cnt + n3Cnt + n4Cnt + n5Cnt + n6Cnt;

        expect(totalCnt).toEqual(17);
      } catch (error) {
        done(error);
      }
    });
    done();
  });
});
