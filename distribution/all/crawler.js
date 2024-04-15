var Crawler = require("crawler");
const { id } = require("../util/util");

const crawler = function (config) {
  let context = {};
  let distribution = global.distribution;
  context.gid = config.gid || "all";
  context.hash = config.hash || id.naiveHash;
  var c = new Crawler();

  return {
    getPage: (baseUrl, getPagecallback) => {
      getPagecallback = getPagecallback || function () {};
      // base url: https://www.usenix.org/publications/proceedings
      // page example: https://www.usenix.org/publications/proceedings?page=345

      c.queue([
        {
          uri: baseUrl,
          callback: function (error, res, cb) {
            if (error) {
              getPagecallback(error);
            } else {
              var $ = res.$;
              var lastPageURL = $("a[title='Go to last page']").attr("href");
              var pageNumber = lastPageURL.match(/page=(\d+)/);

              // get page url
              if (pageNumber && pageNumber.length > 1) {
                let pageCnt = pageNumber[1];
                let msgCnter = pageNumber[1];
                while (pageCnt > 0) {
                  let pageUrl = {
                    page: pageCnt,
                    url: `${baseUrl}?page=${pageCnt}`,
                  };
                  let pageUrls = [{ page: 0, url: baseUrl }];
                  pageUrls.push(pageUrl);
                  pageCnt -= 1;
                  let pageId = id.getID(pageUrl);

                  // distribute page urls to other nodes
                  distribution[context.gid].store.put(
                    pageUrl,
                    { key: pageId, gid: "pagesUrl" },
                    (e, v) => {
                      if (e) {
                        getPagecallback(new Error(`[ERROR] store.put: ${e} `));
                      } else {
                        msgCnter--;
                        if (msgCnter === 0) {
                          // check if all page urls are store successfully
                          getPagecallback(null, pageUrls); // for test purpose
                        }
                      }
                    }
                  );
                }
              } else {
                getPagecallback(
                  new Error(`Page number not found in the href ${lastPageURL}.`)
                );
              }
            }
          },
        },
      ]);
    },

    getArticle: (pageUrl, getArticleCallback) => {
      // example article url: https://www.usenix.org/conference/usenixsecurity24/presentation/wen
      var subC = new Crawler({
        callback: function (error, res, cb) {
          if (error) {
            console.log(error);
          } else {
            var $ = res.$;
            let abstractText = $(
              ".field-name-field-paper-description .field-item"
            ).text();
            // console.log(`==================================================`);
            // console.log(`Abstract: ${abstractText}`);
            // console.log(`article: ${JSON.stringify(res.options.articleObj)}\n`);

            let article = {};
            article.conference = res.options.articleObj[0].text;
            article.title = res.options.articleObj[1].text;
            article.authors = res.options.articleObj[2].text;
            article.abstract = abstractText;
           
            distribution[gid].store.put(
              article,
              { key: distribution.util.getID(article), gid: "articles" },
              (e, v) => {
                console.log(`${gid}.store.put error :${e}, value: ${v}`);
                cb(e, v);
              }
            );
          }
        },
      });

      var c = new Crawler({
        callback: function (error, res, cb) {
          if (error) {
            console.log(error);
          } else {
            var $ = res.$;
            var articles = [];
            $("tbody tr").each(function () {
              var rowData = [];

              // Iterate over each <tr> element within <tbody>
              $(this)
                .find("td")
                .each(function () {
                  // Iterate over each <td> element within the current <tr>
                  var tdContent = $(this).text().trim(); // Get the text content of <td>
                  var link = $(this).find("a").attr("href"); // Get the href attribute of <a> inside <td>
                  if (link) {
                    // title and article
                    rowData.push({
                      text: tdContent,
                      href: link,
                    });
                  } else {
                    // authors
                    rowData.push({
                      text: tdContent,
                    });
                  }
                });
              articles.push(rowData);
            });
            articles.forEach((article) => {
              subC.queue({
                uri: `https://www.usenix.org${article[1].href}`,
                articleObj: article,
              });
            });
            getArticleCallback(null, articles);
            // each element in articles is represented as:
            // [
            //     { text: "USENIX Security '23" },
            //     {
            //       text: 'Pool-Party: Exploiting Browser Resource Pools for Web Tracking',
            //       href: '/conference/usenixsecurity23/presentation/snyder'
            //     },
            //     {
            //       text: 'Peter Snyder, Soroush Karami, Arthur Edelstein, Benjamin Livshits, Hamed Haddadi'
            //     }
            // ]
          }
        },
      });

      c.queue(pageUrl);
    },
  };
};

module.exports = crawler;
