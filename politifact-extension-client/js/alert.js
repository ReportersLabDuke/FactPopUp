// JavaScript source code
latest_status_id = '';
user_id = 751627720790986752;
screen_name = 'politifactlive';
var links = [];
var media_links = [];
var counter = 1;
var timer = -1;

// Returns a new notification ID used in the notification.
//from: https://docs.microsoft.com/en-us/azure/notification-hubs/notification-hubs-chrome-push-notifications-get-started
function getNotificationId() {
    var id = Math.floor(Math.random() * 9007199254740992) + 1;
    return id.toString();
}

// Set up a listener for GCM message event.
chrome.gcm.onMessage.addListener(function (message) { console.log(message); });

chrome.runtime.onInstalled.addListener(function (object) {
    chrome.tabs.create({ url: "popup.html" }, function (tab) {
        console.log("New tab launched with popup.html");
    });
});

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