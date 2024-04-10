var Crawler = require("crawler");

const crawler = {
    getPage: (url, callback) => {
        var c = new Crawler({
            callback : function (error, res, done) {
                if(error){
                    console.log(error);
                }else{
                    var $ = res.$;
                    console.log($(".item-list").html());
                }
                done();
            }
        });
        
        c.queue(url);

        // File storage place: store/s-sid/pagesUrl
        // Key: hash(value) 
        // Value: {page: 1, url: https://www.usenix.org/publications/proceedings?page=1}

    },
    
    getArticle: (pageUrl, callback) =>{

        var c = new Crawler({
            callback : function (error, res, done) {
                if(error){
                    console.log(error);
                }else{
                    var $ = res.$;
                    console.log($(".item-list").html());
                }
                done();
            }
        });
        
        c.queue(pageUrl);

        // File storage store/s-sid/pagesHtml
        // Key: hash(value)
        // Value: html内容:string
    }
}

module.exports = crawler;

