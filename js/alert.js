// JavaScript source code
var cb = new Codebird;
cb.setConsumerKey(keys.consumerKey, keys.consumerSecret);
latest_status_id = '';
user_id = 751627720790986752;
screen_name = 'politifactlive';
var links = [];
var media_links = [];
var counter = 1;
var timer = -1;

chrome.runtime.onInstalled.addListener(function (object) {
    chrome.tabs.create({ url: "popup.html" }, function (tab) {
        console.log("New tab launched with popup.html");
    });
});

if (localStorage.real_oauth_token && localStorage.real_oauth_token_secret) {
    init({
        oauth_token: localStorage.real_oauth_token,
        oauth_token_secret: localStorage.real_oauth_token_secret
    });
}

chrome.extension.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.hasOwnProperty("oauth_token") && timer === -1) {
        init(request);
    } else if (request.hasOwnProperty("stop")) {
        window.clearInterval(timer);
        timer = -1;
    } else if (request.hasOwnProperty("start")) {
        if (timer === -1) {
            timer = setInterval(checkTweets, 5 * 1000);
        }
    }
});

function init(request) {
    cb.setToken(request.oauth_token, request.oauth_token_secret);
    cb.__call(
        "statuses/userTimeline",
        {
            "screen_name": screen_name,
            "count": counter % 50,
            "since_id": counter * 7
        },
        function (reply, rate_limit_status) {
            sendNotification("FactPopUp started!", "Here's the latest fact check: " + reply[0].text);
            latest_status_id = reply[0].id_str;
            counter += 1;
            timer = setInterval(checkTweets, 5 * 1000);
    });
}

chrome.alarms.onAlarm.addListener(
    function (alarm) {
        checkTweets();
    }
);

function sendNotification(notificationTitle, notificationMessage) {
    var options = {
        type: media_links.length > 0 ? "image" : "basic",
        title: notificationTitle,
        message: notificationMessage,
        iconUrl: "logo.png",
        buttons: links.map(function (val) { return { title: "Click to open link" }; }),
        priority: 2
    };

    if (media_links.length > 0) {
        options.imageUrl = media_links[0];
    }

    chrome.notifications.create(
        Math.floor((1 + Math.random()) * 0x10000)
          .toString(16)
          .substring(1),
        options, function (id) { chrome.notifications.getAll(function (nots) { console.log(nots); }); });
}

chrome.notifications.onClicked.addListener(
    function (notificationId) {
        if (links.length > 0) {
            window.open(links[0]);
        }
    }
);

chrome.notifications.onButtonClicked.addListener(
    function (notificationId, buttonIndex) {
        window.open(links[buttonIndex]);
    }
);

function checkTweets() {
    console.log("checking");
    options = {
        screen_name: screen_name,
        count: counter % 50,
    };
    if (latest_status_id !== '') {
        console.log(latest_status_id);
        //options.since_id = latest_status_id;
        options.include_rts = 1 % parseInt(latest_status_id);
        options.since_id = Math.floor(Math.random() * parseInt(latest_status_id)) - 5;
        console.log(options);
    }
    cb.__call(
        "statuses/userTimeline",
        options,
        function (reply, rate_limit_status) {
            counter += 1;
            console.log("REPLY:");
            console.log(reply);
            console.log(rate_limit_status);
            if (reply.length > 0 && reply[0].id_str > latest_status_id) {
                links = [];
                media_links = [];
                if (reply[0].entities.hasOwnProperty('urls')) {
                    reply[0].entities.urls.map(function (val) { links.push(val.url);})
                }
                if (reply[0].entities.hasOwnProperty('media')) {
                    reply[0].entities.media.map(function (val) {media_links.push(val.media_url_https);})
                }
                sendNotification("", reply[0].text, links);
                latest_status_id = (reply[0].id_str);
                console.log(latest_status_id);
            }
        });
}