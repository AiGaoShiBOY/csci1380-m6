var Crawler = require("crawler");

var c = new Crawler({
    callback : function (error, res, done) {
        if(error){
            console.log(error);
        }else{
            var $ = res.$;
            // $ 默认为 Cheerio 解析器
            // 它是核心jQuery的精简实现，可以按照jQuery选择器语法快速提取DOM元素
            console.log($("#page-title").html());
            console.log($(".field-name-field-paper-people-text .field-item").text());
            console.log($(".field-name-field-paper-description .field-item").text()); 
        }
        done();
    }
});

// 将一个URL加入请求队列，并使用默认回调函数
c.queue('https://www.usenix.org/conference/usenixsecurity24/presentation/sawaya');