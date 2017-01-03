var Twit = require('twit');
var server_keys = require('./server_keys');

var T = new Twit({
  consumer_key:         server_keys.consumer_key,
  consumer_secret:      server_keys.consumer_secret,
  access_token:         server_keys.access_token,
  access_token_secret:  server_keys.access_token_secret,
  timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
})

//
//  filter the twitter public stream by the word 'mango'.
//
var stream = T.stream('statuses/filter', { follow: '751627720790986752' })

stream.on('tweet', function (tweet) {
  console.log(tweet.text)
})
