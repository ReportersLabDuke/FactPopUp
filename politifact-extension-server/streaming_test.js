var Twit = require('twit');
var azure = require('azure-sb');
var server_keys = require('./server_keys');

Debug = true;
var registrationExpiryThreshold = 1 * 60 * 1000;
var purgeInterval = 60 * 60 * 1000;

var T = new Twit({
  consumer_key:         server_keys.consumer_key,
  consumer_secret:      server_keys.consumer_secret,
  access_token:         server_keys.access_token,
  access_token_secret:  server_keys.access_token_secret,
  timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
})

var notificationHubService = azure.createNotificationHubService("FactPopUpHub", server_keys.connection_string);

function errorResponseLogger(error, response) {
    if (!error) {
        if (Debug) { console.log(response);}
    } else {
        console.log("ERROR!");
        console.log(error);
    }
}

//purges all expired registrations
function purgeRegistrations(notificationHub) {
    var registrations = [];
    notificationHub.listRegistrations(null, function (error, response) {
        if (!error) {
            if (Debug) { console.log(response);}
            registrations = response;

            registrations.forEach(function (registration) {
                expireTime = new Date(registration.ExpirationTime);
                debugger;
                if (Date.now() > expireTime.getTime()) {
                    debugger;
                    notificationHub.deleteRegistration(registration.RegistrationId, null, errorResponseLogger);
                }
            });
        } else {
            console.log("ERROR!");
            console.log(error);
        }
    });
    setInterval(purgeRegistrations, purgeInterval, notificationHubService);
}

purgeRegistrations(notificationHubService);
setInterval(purgeRegistrations, purgeInterval, notificationHubService);

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
    notificationHubService.gcm.send(null, payload, errorResponseLogger);
})
