var Twit = require('twit');
var azure = require('azure-sb');
var server_keys = require('./server_keys');

Debug = true;

var T = new Twit({
  consumer_key:         server_keys.consumer_key,
  consumer_secret:      server_keys.consumer_secret,
  access_token:         server_keys.access_token,
  access_token_secret:  server_keys.access_token_secret,
  timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
})

var notificationHubService = azure.createNotificationHubService("FactPopUpHub", server_keys.connection_string);

//notificationHubService.listRegistrations(null, function(error, response) { registrations = response; });
//registrations[0]._.updated;

//
//  filter the twitter public stream to get tweets from @ItsOfficialTest
//
var stream = T.stream('statuses/filter', { follow: '751627720790986752' })

stream.on('tweet', function (tweet) {
    console.log(tweet);
    var payload = {
        data: {
            tweet,
        }
    };
    notificationHubService.gcm.send(null, payload, function (error) {
        if (!error) {
            if (Debug) { console.log(tweet.text); }
        } else {
            console.log("ERROR");
            console.log(tweet);
        }
    });
})
