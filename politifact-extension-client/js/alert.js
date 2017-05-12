// JavaScript source code
latest_status_id = '';
var links = []; //kept in script variable so that links can be accessed from notification click event handler
var media_links = []; //might need to access media links too outside of notification...
var sendingNotifications = true;

//from: https://docs.microsoft.com/en-us/azure/notification-hubs/notification-hubs-chrome-push-notifications-get-started
var registrationId = "";
var hubName = "FactPopUpHub", connectionString = keys.azure_connection_string;
var originalUri = "", targetUri = "", endpoint = "", sasKeyName = "", sasKeyValue = "", sasToken = "";
var gcm_sender_id = keys.gcm_sender_id;
var refreshInterval = 24 * 60 * 60 * 1000;

var parser = new DOMParser();

/**
application flow:
1) on startup/when user hits start notifications button popup sends start message to background to call register()
2) register calls registerWithGCM(), which calls chrome gcm registration
- background page also notes that notifications will start
3) the chrome gcm callback calls registerWithNH() and sets gcm registration id as variable and in local storage
4) registerWithNH() sends a POST request to notification hub with the gcm registration id
5) the NH registration callback extracts the nh registration id from the nh response stores it in local storage
6) when the stop registration button is pressed, stop message is sent to background page
7) the message event handler gets the nh registration id from local storage
- message is also sent to background alert.js page that notifications will stop
8) the event handler then calls sendNHDeleteRequest with the registration id
9) sendNHDeleteRequest then sends a DELETE request to notification hub
**/

function updateLog(status) {
    console.log(status);
}

function register() {
    registerWithGCM();
}

function registerWithGCM() {
    chrome.gcm.register([gcm_sender_id], registerCallback);
}

//NH registration can only be done after GCM registration (GCM id needed), so GCM callback calls NH registration
function registerCallback(regId) {
    registrationId = regId;

    if (chrome.runtime.lastError) {
        // When the registration fails, handle the error and retry the
        // registration later.
        updateLog("Registration failed: " + chrome.runtime.lastError.message);
        return;
    } else {
        registerWithNH();
        updateLog("Registration with GCM succeeded.");

        // Mark that the first-time registration is done.
        chrome.storage.local.set({
            registered: true,
            registrationId: regId,
        });
    }
}

function registerWithNH() {
    splitConnectionString();
    generateSaSToken();
    sendNHRegistrationRequest();
}

// From http://msdn.microsoft.com/library/dn495627.aspx
function splitConnectionString() {
    var parts = connectionString.split(';');
    if (parts.length != 3)
        throw "Error parsing connection string";

    parts.forEach(function (part) {
        if (part.indexOf('Endpoint') == 0) {
            endpoint = 'https' + part.substring(11);
        } else if (part.indexOf('SharedAccessKeyName') == 0) {
            sasKeyName = part.substring(20);
        } else if (part.indexOf('SharedAccessKey') == 0) {
            sasKeyValue = part.substring(16);
        }
    });

    originalUri = endpoint + hubName;
}

function generateSaSToken() {
    targetUri = encodeURIComponent(originalUri.toLowerCase()).toLowerCase();
    var expiresInMins = 10; // 10 minute expiration

    // Set expiration in seconds.
    var expireOnDate = new Date();
    expireOnDate.setMinutes(expireOnDate.getMinutes() + expiresInMins);
    var expires = Date.UTC(expireOnDate.getUTCFullYear(), expireOnDate
      .getUTCMonth(), expireOnDate.getUTCDate(), expireOnDate
      .getUTCHours(), expireOnDate.getUTCMinutes(), expireOnDate
      .getUTCSeconds()) / 1000;
    var tosign = targetUri + '\n' + expires;

    // Using CryptoJS.
    var signature = CryptoJS.HmacSHA256(tosign, sasKeyValue);
    var base64signature = signature.toString(CryptoJS.enc.Base64);
    var base64UriEncoded = encodeURIComponent(base64signature);

    // Construct authorization string.
    sasToken = "SharedAccessSignature sr=" + targetUri + "&sig="
                    + base64UriEncoded + "&se=" + expires + "&skn=" + sasKeyName;
}

//update parameter determines whether to send an update or create request
function sendNHRegistrationRequest() {
    var registrationPayload =
    "<?xml version=\"1.0\" encoding=\"utf-8\"?>" +
    "<entry xmlns=\"http://www.w3.org/2005/Atom\">" +
        "<content type=\"application/xml\">" +
            "<GcmRegistrationDescription xmlns:i=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns=\"http://schemas.microsoft.com/netservices/2010/10/servicebus/connect\">" +
                "<GcmRegistrationId>{GCMRegistrationId}</GcmRegistrationId>" +
            "</GcmRegistrationDescription>" +
        "</content>" +
    "</entry>";

    // Update the payload with the registration ID obtained earlier.
    registrationPayload = registrationPayload.replace("{GCMRegistrationId}", registrationId);

    var url = originalUri + "/registrations/?api-version=2014-09".replace("{GCMRegistrationId}", registrationId);
    var client = new XMLHttpRequest();

    client.onload = function () {
        if (client.readyState == 4) {
            if (client.status == 200) {
                updateLog("Notification Hub Registration succesful!");
                updateLog(client.responseText);
                var responseXml = parser.parseFromString(client.responseText, "text/xml");
                id_tag = responseXml.getElementsByTagName("RegistrationId");
                chrome.storage.local.set({
                    nhRegistrationId: responseXml.getElementsByTagName("RegistrationId")[0].innerHTML
                });
                //setInterval(registerWithNH, refreshInterval, false);
                chrome.alarms.create("registrationTimer", { delayInMinutes: refreshInterval / (1000 * 60) })
            } else {
                updateLog("Notification Hub Registration did not succeed!");
                updateLog("HTTP Status: " + client.status + " : " + client.statusText);
                updateLog("HTTP Response: " + "\n" + client.responseText);
            }
        }
    };

    client.onerror = function () {
        updateLog("ERROR - Notification Hub Registration did not succeed!");
    }

    client.open("POST", url, true);
    client.setRequestHeader("Content-Type", "application/atom+xml;type=entry;charset=utf-8");
    client.setRequestHeader("Authorization", sasToken);
    client.setRequestHeader("x-ms-version", "2015-01");

    try {
        client.send(registrationPayload);
    }
    catch (err) {
        updateLog(err.message);
    }
}

chrome.alarms.onAlarm.addListener(function (alarm) {
    if (alarm.name == "registrationTimer") {
        console.log("registration timer!");
        registerWithNH();
    }
});

function sendNHDeleteRequest(regId) {
    var nhRegistrationId = "";

    var url = originalUri + "/registrations/{NHRegistrationId}?api-version=2015-01".replace("{NHRegistrationId}", regId);

    var client = new XMLHttpRequest();
    client.onload = function () {
        if (client.readyState == 4) {
            if (client.status == 200) {
                updateLog("Notification Hub Deletion succesful!");
                updateLog(client.responseText);
                chrome.storage.local.set({
                    nhRegistrationId: ""
                });
            } else {
                updateLog("Notification Hub Registration did not succeed!");
                updateLog("HTTP Status: " + client.status + " : " + client.statusText);
                updateLog("HTTP Response: " + "\n" + client.responseText);
            }
        }
    };

    client.onerror = function () {
        updateLog("ERROR - Notification Hub Registration did not succeed!");
    }

    client.open("DELETE", url, true);
    client.setRequestHeader("Content-Type", "application/atom+xml;type=entry;charset=utf-8");
    client.setRequestHeader("Authorization", sasToken);
    client.setRequestHeader("x-ms-version", "2015-01");
    client.setRequestHeader("If-Match", "*");

    try {
        client.send("");
    }
    catch (err) {
        updateLog(err.message);
    }
}

// Returns a new notification ID used in the notification.
//from: https://docs.microsoft.com/en-us/azure/notification-hubs/notification-hubs-chrome-push-notifications-get-started
function getNotificationId() {
    var id = Math.floor(Math.random() * 9007199254740992) + 1;
    return id.toString();
}

// Set up a listener for GCM message event.
chrome.gcm.onMessage.addListener(function (message) {
    if (sendingNotifications) {
        console.log(JSON.parse(message.data.tweet));
        var tweet_obj = JSON.parse(message.data.tweet);

        links = [];
        media_links = [];
        if (tweet_obj.entities.hasOwnProperty('urls')) {
            tweet_obj.entities.urls.map(function (val) { links.push(val.url); })
        }
        if (tweet_obj.entities.hasOwnProperty('media')) {
            tweet_obj.entities.media.map(function (val) { media_links.push(val.media_url_https); })
        }

        //sendNotification("", tweet_obj.text);
        sendMessage("", tweet_obj.text, links, media_links);
    } else {
        console.log("Message recieved, not listening")
    }
});

chrome.runtime.onInstalled.addListener(function (object) {
    chrome.tabs.create({ url: "popup.html" }, function (tab) {
        console.log("New tab launched with popup.html");
    });
    sendingNotifications = true;
    register();
});

chrome.runtime.onStartup.addListener(function (object) {
    sendingNotifications = true;
    register();
});

chrome.runtime.onSuspend.addListener(function (object) {
    sendingNotifications = false;
    chrome.storage.local.get("nhRegistrationId", function (resp) {
        if (resp.hasOwnProperty("nhRegistrationId")) {
            generateSaSToken();
            sendNHDeleteRequest(resp.nhRegistrationId);
        }
    });
});

chrome.extension.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.hasOwnProperty("oauth_token") && timer === -1) {
        init(request);
    } else if (request.hasOwnProperty("stop")) {
        sendingNotifications = false;
        chrome.storage.local.get("nhRegistrationId", function (resp) {
            if (resp.hasOwnProperty("nhRegistrationId")) {
                generateSaSToken();
                sendNHDeleteRequest(resp.nhRegistrationId);
            }
        });
    } else if (request.hasOwnProperty("start")) {
        sendingNotifications = true;
        register();
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
        options, 
        function (id) {
            chrome.notifications.getAll(
                function (notifications) {
                    console.log(notifications);
                });
        });
}

function sendMessage(notificationTitle, notificationMessage, links, mediaLinks) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {message: notificationMessage, urls: links, pictureUrls: mediaLinks}, function(response) {
      console.log(JSON.stringify(response));
    });
  });
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
