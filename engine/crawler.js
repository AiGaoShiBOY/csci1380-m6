const distribution = require('../distribution');
const util = require('../distribution/util/util');

async function startCrawl() {
  await util.promisify(distribution.engine.crawler.getPage)(
    'https://www.usenix.org/publications/proceedings',
  );
  const nodes = await util.promisify(distribution.local.groups.get)('engine');
  const results = await Promise.allSettled(
    Object.keys(nodes).map(async (node) => {
      const nodeConfig = nodes[node];
      const message = [{gid: 'pagesUrl'}];
      const remote = {node: nodeConfig, service: 'store', method: 'get'};

      const pageKeys = await util.promisify(distribution.local.comm.send)(
        message,
        remote,
      );

      if (!pageKeys) {
        return;
      }

      await Promise.allSettled(
        pageKeys.map(async (pageKey) => {
          const pageMessage = [{key: pageKey, gid: 'pagesUrl'}];
          const pageRemote = {
            node: nodeConfig,
            service: 'store',
            method: 'get',
          };

          const pageObj = await util.promisify(distribution.local.comm.send)(
            pageMessage,
            pageRemote,
          );
          const getArticlesMessage = [pageObj.url];
          const getArticlesRemote = {
            node: nodeConfig,
            service: 'crawler',
            method: 'getArticles',
          };

          return util.promisify(distribution.local.comm.send)(
            getArticlesMessage,
            getArticlesRemote,
          );
        }),
      );
    }),
  );
}

// async function startCrawl() {
//   await util.promisify(distribution.engine.crawler.getPage)(
//     'https://www.usenix.org/publications/proceedings',
//   );

//   const nodes = await util.promisify(distribution.local.groups.get)('engine');
//   for (const node of Object.keys(nodes)) {
//     const nodeConfig = nodes[node];
//     const message = [{gid: 'pagesUrl'}];
//     const remote = {node: nodeConfig, service: 'store', method: 'get'};
//     const pageKeys = await util.promisify(distribution.local.comm.send)(
//       message,
//       remote,
//     );
//     if (!pageKeys) {
//       continue;
//     }
//     for (const pageKey of pageKeys) {
//       const message = [{key: pageKey, gid: 'pagesUrl'}];
//       const remote = {
//         node: nodeConfig,
//         service: 'store',
//         method: 'get',
//       };
//       const pageObj = await util.promisify(distribution.local.comm.send)(
//         message,
//         remote,
//       );
//       const getArticlesMessage = [pageObj.url];
//       const getArticlesRemote = {
//         node: nodeConfig,
//         service: 'crawler',
//         method: 'getArticles',
//       };
//       try {
//         await util.promisify(distribution.local.comm.send)(
//           getArticlesMessage,
//           getArticlesRemote,
//         );
//       } catch (e) {
//         console.log(e);
//       }
//     }
//   }
// }

module.exports = startCrawl;
