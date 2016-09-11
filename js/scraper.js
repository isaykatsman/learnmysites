var BBC_feed = 'http://feeds.bbci.co.uk/news/world/rss.xml';
// var NYT_feed = 'http://rss.nytimes.com/services/xml/rss/nyt/World.xml';
var TBUF_feed='http://www.technobuffalo.com/feed/';
var REUTERS_feed='http://feeds.reuters.com/Reuters/worldNews';
var CNN_feed='http://rss.cnn.com/rss/cnn_world.rss';
var USE_CREDENTIALS = false;


var prepare_text = function(str){
  var re_letters = /[^a-zA-Z]/g;
  str = str.replace(re_letters, ' ').toLowerCase();
  str = str.split(/\ +/);
  str = removeStopWords(str);
  // str = str.map(function(x){return stemmer(x, false);});
  return str;
 }
 
var scrape_data = function(callback){
   var RSS_feeds = [REUTERS_feed, BBC_feed];
   var articles = [];
   var finished_loading_count = 0;
   RSS_feeds.forEach(function(obj, idx){
     $.get("https://crossorigin.me/"+obj, function(data){
        if (typeof data == "string"){
          var new_data = $.parseXML(data);
        } else {
          var new_data = data;
        }
        console.log(new_data);
        var texts= [];
        var total_loading = 0;
        var finished_loading = 0;
        $(new_data).find("item").each(function(){
          var desc = $(this).find("description").text();
          var title = $(this).find("title").text();
          var link = "https://crossorigin.me/"+$(this).find("link").text();
          total_loading +=1;
          // console.log(link);
          $.ajax({
            url: link,
            xhrFields: {
              withCredentials: USE_CREDENTIALS
            },
            success: function(data){
              var cur_words = prepare_text($(data).find('p').text());
              // console.log(cur_words);
              var meta = {}
              meta.title = title;
              meta.desc = desc;
              articles.push({text: cur_words, meta: meta});

              finished_loading+=1;
              console.log(finished_loading, total_loading);
              if (total_loading == finished_loading && idx==RSS_feeds.length-1){
                generateVoc(articles);
              }
            },
            error: function(){
              console.log("ERROR");
              finished_loading+=1;
              console.log(finished_loading, total_loading);
              if (total_loading == finished_loading){
                generateVoc(articles);
              }
            },
            timeout: 60000
          });
        });
         /* var cur_words = desc+' '+title;
          cur_words = prepare_text(cur_words);
          cur_words = cur_words.map(function(x){return stemmer(x, false);});
          texts.push({text: cur_words});*/
        // articles = articles.concat(texts);
        // finished_loading_count ++;
        
     }); 
   })

   var vocab = [];
   var VOCAB_LENGTH = 4000;
   var generateVoc = function(articles){
    var dict = {};
    articles.forEach(function(obj){
      var word_list = obj.text;
      word_list.forEach(function(obj){
        dict[obj] = (dict[obj]||0)+1;
      })
    });
    vocab = Object.keys(dict).sort(function(a, b){return dict[b]-dict[a];});
    console.log(articles);
    console.log(vocab);
    console.log("unique words: ", vocab.length);
    console.log("unique articles: ", articles.length);
    vocab = vocab.slice(0, VOCAB_LENGTH);
    for(var i=0; i<40; i++){
      console.log(vocab[i], dict[vocab[i]]);
    }
    articles.forEach(function(article){
      var vec = new Array(VOCAB_LENGTH).fill(0);
      var text = article.text;
      vocab.forEach(function(word, idx){
        if (text.indexOf(word)!=-1){
          vec[idx] = 1;
        }
      });
      article.vec = vec;

    });
    callback(articles);
  }
}