var Crawler = require('crawler');
const {id} = require('../util/util');
const util = require('../util/util');

const crawler = function (config) {
  const removeAccents = (str) =>
    // convert accented char to normal ones â -> a
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  let context = {};
  let distribution = global.distribution;
  context.gid = config.gid || 'all';
  context.hash = config.hash || id.naiveHash;
  const crawlerForBaseUrl = new Crawler();
  const crawlerForPageUrl = new Crawler();
  const crawlerForArticleUrl = new Crawler();

  return {
    getPage: (baseUrl, getPagecallback) => {
      getPagecallback = getPagecallback || function () {};
      crawlerForBaseUrl.queue({
        uri: baseUrl,
        timeout: 10000,
        retries: 0,
        callback: function (error, res, done) {
          if (error) {
            getPagecallback(error);
            done();
            return;
          }
          var $ = res.$;
          var lastPageURL = $("a[title='Go to last page']").attr('href');
          var pageNumber = lastPageURL.match(/page=(\d+)/);
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
                    getPagecallback(new Error(`[ERROR] store.put: ${e} `));
                  } else {
                    msgCnter--;
                    if (msgCnter === 0) {
                      // check if all page urls are store successfully
                      getPagecallback(null, pageUrls); // for test purpose
                      done();
                      return;
                    }
                  }
                },
              );
            }
          } else {
            getPagecallback(new Error(`[ERROR] page number not found`), null);
            done();
          }
        },
      });
    },

    getArticles: function (pageUrl, getArticlesCallback) {
      // first get the page url
      crawlerForPageUrl.queue({
        uri: pageUrl,
        timeout: 10000,
        retries: 0,
        callback: function (error, res, done) {
          if (error) {
            getArticlesCallback(error);
            done();
            return;
          }
          var $ = res.$;
          var articles = [];
          $('tbody tr').each(function () {
            var rowData = [];

            $(this)
              .find('td')
              .each(function () {
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
          done();
          // now we get all the articleUrl for parsing
          for (article of articles) {
            if (!article[1] || !article[1].hasOwnProperty('href')) {
              msgCnt--;
              continue;
            }
            const articleUrl = `https://www.usenix.org${article[1].href}`;
            const articleObj = article;
            crawlerForArticleUrl.queue({
              uri: articleUrl,
              timeout: 10000,
              retries: 0,
              callback: function (err2, res2, done2) {
                if (err2) {
                  getArticlesCallback(err2);
                  done();
                  return;
                }
                var $ = res2.$;
                let abstractText = $(
                  '.field-name-field-paper-description .field-item',
                ).text();

                let article = {};
                function replaceNonASCIIChars(string) {
                  return string.replace(/[^\x00-\x7F]/g, ' ');
                }

                article.conference = replaceNonASCIIChars(articleObj[0].text);
                article.title = replaceNonASCIIChars(articleObj[1].text);
                article.abstract = replaceNonASCIIChars(abstractText);

                const authors = $('.field-name-field-paper-people-text')
                  .text()
                  .replace(/^Authors:/, '')
                  .trim();
                article.authors = replaceNonASCIIChars(removeAccents(authors));
                done2();

                distribution[context.gid].store.put(
                  article,
                  {key: util.id.getID(article), gid: 'articles'},
                  (e, v) => {
                    console.log(`after getArticle: ${article.title}`);
                    msgCnt--;
                    if (msgCnt === 0) {
                      getArticlesCallback(null, 1);
                    }
                  },
                );
              },
            });
          }
        },
      });
    },
  };
};

module.exports = crawler;
