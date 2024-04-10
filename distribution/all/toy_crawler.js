var Crawler = require("crawler");

var subC = new Crawler({
  callback: function (error, res, done) {
    if (error) {
      console.log(error);
    } else {
        var $ = res.$;
        let abstractText = $(".field-name-field-paper-description .field-item").text();
        console.log(`==================================================`)
        // console.log(`Abstract: ${abstractText}`)
        // console.log(`article: ${JSON.stringify(res.options.articleObj)}\n`)
        let article = {}
        article.conference = res.options.articleObj[0].text
        article.title = res.options.articleObj[1].text
        article.authors = res.options.articleObj[2].text
        article.abstract = abstractText
        console.log(`article: ${JSON.stringify(article)}\n`)

    }
  },
});

// https://www.usenix.org/conference/usenixsecurity24/presentation/wen
var c = new Crawler({
  callback: function (error, res, done) {
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
      articles.forEach((ele) => {
        subC.queue({uri: `https://www.usenix.org${ele[1].href}`, articleObj: ele})
      })
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
    done();
  },
});

// 将一个URL加入请求队列，并使用默认回调函数
c.queue("https://www.usenix.org/publications/proceedings?page=4");
