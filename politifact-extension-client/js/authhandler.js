//from: https://docs.microsoft.com/en-us/azure/notification-hubs/notification-hubs-chrome-push-notifications-get-started
var registrationId = "";
var hubName = "FactPopUpHub", connectionString = keys.azure_connection_string;
var originalUri = "", targetUri = "", endpoint = "", sasKeyName = "", sasKeyValue = "", sasToken = "";
var gcm_sender_id = keys.gcm_sender_id;
var refreshInterval = 24 * 60 * 60 * 1000;

var parser = new DOMParser();

/**
application flow:
1) on startup/when user hits start notifications button, call register()
- message is also send to background alert.js page that notifications will start
2) register calls registerWithGCM(), which calls chrome gcm registration
3) the chrome gcm callback calls registerWithNH() and sets gcm registration id as variable and in local storage
4) registerWithNH() sends a POST request to notification hub with the gcm registration id
5) the NH registration callback extracts the nh registration id from the nh response stores it in local storage
6) when the stop registration button is pressed, the button event handler gets the nh registration id from local storage
- message is also sent to background alert.js page that notifications will stop
7) the event handler then calls sendNHDeleteRequest with the registration id
8) sendNHDeleteRequest then sends a DELETE request to notification hub
**/

function updateLog(status) {
    console.log(status);
}

function register() {
    registerWithGCM();
    document.getElementById("stop").removeAttribute("hidden");
    document.getElementById("start").setAttribute("hidden", "true");
    chrome.extension.sendMessage({
        start: "true"
    });
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
                chrome.alarms.create("registrationTimer", {delayInMinutes: refreshInterval/(1000*60)})
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
        registerWithNH();
    }
});

function sendNHDeleteRequest (regId) {
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

document.addEventListener('DOMContentLoaded', function () {
    register();
    chrome.extension.sendMessage({
        start: "true"
    });
});


document.addEventListener('DOMContentLoaded', function () {
    var link = document.getElementById('openStream');
    // onClick's logic below:
    link.addEventListener('click', openStreams);
});

document.addEventListener('DOMContentLoaded', function () {
    var link = document.getElementById('stop');
    // onClick's logic below:
    link.addEventListener('click', stopNotifications);
});

document.addEventListener('DOMContentLoaded', function () {
    var link = document.getElementById('start');
    // onClick's logic below:
    link.addEventListener('click', startNotifications);
});

//document.addEventListener('DOMContentLoaded', function () {
//    var link = document.getElementById('register');
//    // onClick's logic below:
//    link.addEventListener('click', register);
//});

function stopNotifications() {
    document.getElementById("start").removeAttribute("hidden");
    document.getElementById("stop").setAttribute("hidden", "true");
    chrome.storage.local.get("nhRegistrationId", function (resp) {
        if (resp.hasOwnProperty("nhRegistrationId")) {
            generateSaSToken();
            sendNHDeleteRequest(resp.nhRegistrationId);
        }
    });
    chrome.extension.sendMessage({
        stop: "true"
    });
}

function startNotifications() {
    document.getElementById("stop").removeAttribute("hidden");
    document.getElementById("start").setAttribute("hidden", "true");
    register();
    chrome.extension.sendMessage({
        start: "true"
    });
}

function openStreams() {
    chrome.tabs.create({ url: "streams.html" }, function (tab) {
        console.log("New tab launched with streams.html");
    });
}