var Crawler = require("crawler");

const crawler = function (config) {
  let context = {};
  context.gid = config.gid || "all";
  context.hash = config.hash || id.naiveHash;
  let distribution = global.distribution;
  return {
    getPage: (baseUrl, callback) => {
      callback = callback || function () {};
      // base url: https://www.usenix.org/publications/proceedings
      // page example: https://www.usenix.org/publications/proceedings?page=345

      var c = new Crawler({
        callback: function (error, res, cb) {
          if (error) {
            callback(error);
          } else {
            var $ = res.$;
            var lastPageURL = $("a[title='Go to last page']").attr("href");
            var pageNumber = lastPageURL.match(/page=(\d+)/);

            // get page url
            if (pageNumber && pageNumber.length > 1) {
              console.log(`total number of pages: ${pageNumber[1]}`);
              let pageCnt = pageNumber[1];
              let msgCnter = pageNumber[1];
              while (pageCnt > 0) {
                let pageUrl = `${baseUrl}?page=${pageCnt}`;
                let pageUrls = [{ page: 0, url: baseUrl }];
                pageCnt -= 1;

                // distribute page urls to other nodes
                distribution[gid].store.put(
                  pageUrl,
                  { key: distribution.util.getID(pageUrl), gid: "pagesUrl" },
                  (e, v) => {
                    console.log(`${gid}.store.put error :${e}, value: ${v}`);
                    if (e) {
                      callback(new Error(`[ERROR] store.put: ${e} `));
                    } else {
                      pageUrls.push(pageUrl);
                      msgCnter--;
                      if (msgCnter === 0) {
                        // check if all page urls are store successfully
                        callback(null, pageUrls); // for test purpose
                      }
                    }
                  }
                );
              }
            } else {
              callback(
                new Error(`Page number not found in the href ${lastPageURL}.`)
              );
            }
          }
        },
      });

      c.queue(baseUrl);
      // const pageurls = [...urls]
      // Key: hash(value)
      // Value: {page: 1, url: https://www.usenix.org/publications/proceedings?page=1}
    },

    getArticle: (pageUrl, callback) => {
      // https://www.usenix.org/conference/usenixsecurity24/presentation/wen

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
            // File storage store/s-sid/pagesHtml
            // Key: hash(value)
            // Value: article obj
            distribution[gid].store.put(
              article,
              {key: distribution.util.getID(article), gid: 'articles'},
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
                  var link = $(this).find("a[href*=presentation]").attr("href"); // Get the href attribute of <a> inside <td>
                  if (link) {
                    // article link
                    rowData.push({
                      text: tdContent,
                      href: link,
                    });
                  } else {
                    // title or author names
                    rowData.push({
                      text: tdContent,
                    });
                  }
                });
              articles.push(rowData);
            });
            articles.forEach((article) => {
              subC.queue({
                uri: `https://www.usenix.org${ele[1].href}`,
                articleObj: article,
              });
            });
            callback(null, articles);
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
