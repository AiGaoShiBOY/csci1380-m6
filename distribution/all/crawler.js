var Crawler = require('crawler');
const {id} = require('../util/util');

const crawler = function(config) {
  const removeAccents = (str) =>
    // convert accented char to normal ones â -> a
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  let context = {};
  let distribution = global.distribution;
  context.gid = config.gid || 'all';
  context.hash = config.hash || id.naiveHash;
  var c = new Crawler();

  return {
    getPage: (baseUrl, getPagecallback) => {
      getPagecallback = getPagecallback || function() {};
      // base url: https://www.usenix.org/publications/proceedings
      // page example: https://www.usenix.org/publications/proceedings?page=345
      c.queue([
        {
          uri: baseUrl,
          callback: function(error, res, cb) {
            if (error) {
              getPagecallback(error);
            } else {
              var $ = res.$;
              var lastPageURL = $('a[title=\'Go to last page\']').attr('href');
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
                  let pageUrls = [{page: 0, url: baseUrl}];
                  pageUrls.push(pageUrl);
                  pageCnt -= 1;
                  let pageId = id.getID(pageUrl);

                  // distribute page urls to other nodes
                  distribution[context.gid].store.put(
                      pageUrl,
                      {key: pageId, gid: 'pagesUrl'},
                      (e, v) => {
                        if (e) {
                          getPagecallback(new Error(
                              `[ERROR] store.put: ${e} `,
                          ));
                        } else {
                          msgCnter--;
                          if (msgCnter === 0) {
                          // check if all page urls are store successfully
                            getPagecallback(null, pageUrls); // for test purpose
                          }
                        }
                      },
                  );
                }
              } else {
                getPagecallback(
                    new Error(
                        `Page number not found in the href ${lastPageURL}.`,
                    ),
                );
              }
            }
          },
        },
      ]);
    },

    getArticles: (pageUrl, getArticlesCallback) => {
      // example page url: https://www.usenix.org/publications/proceedings?page=345
      // example article url: https://www.usenix.org/conference/usenixsecurity24/presentation/wen
      c.queue([
        {
          uri: pageUrl,
          callback: function(error, res, cb) {
            if (error) {
              getArticlesCallback(error);
            } else {
              var $ = res.$;
              var articles = [];
              $('tbody tr').each(function() {
                var rowData = [];

                $(this)
                    .find('td')
                    .each(function() {
                      // Get the text content of <td>
                      var tdContent = $(this).text().trim();
                      // Get the href attribute of <a> inside <td>
                      var link = $(this).find('a').attr('href');
                      if (link) {
                      // title and article
                        rowData.push({
                          text: tdContent,
                          href: link,
                        });
                      }
                    });
                articles.push(rowData);
              });

              let msgCnt = articles.length;
              articles.forEach((article) => {
                // crawl the abstract of each article
                distribution[context.gid].crawler.getArticle(
                    `https://www.usenix.org${article[1].href}`,
                    article,
                    (e, v) => {
                      if (e) {
                        getArticlesCallback(
                            new Error(`[ERROR] store.put: ${e} `),
                        );
                      } else {
                        msgCnt--;
                        if (msgCnt === 0) {
                          getArticlesCallback(null, 'done');
                        }
                      }
                    },
                );
              });
            }
          },
        },
      ]);
    },

    getArticle: (articleUrl, articleObj, getArticleCallback) => {
      var subC = new Crawler({
        callback: function(error, res, cb) {
          if (error) {
            getArticleCallback(e);
          } else {
            var $ = res.$;
            let abstractText = $(
                '.field-name-field-paper-description .field-item',
            ).text();

            let article = {};
            article.conference = articleObj[0].text;
            article.title = articleObj[1].text;
            article.abstract = abstractText;
            const authors = $('.field-name-field-paper-people-text')
                .text()
                .replace(/^Authors:/, '').trim();
            article.authors = removeAccents(authors);

            distribution[context.gid].store.put(
                article,
                {key: distribution.util.id.getID(article), gid: 'articles'},
                (e, v) => {
                  getArticleCallback(e, v);
                },
            );
          }
        },
      });
      subC.queue(articleUrl);
    },
  };
};

module.exports = crawler;
