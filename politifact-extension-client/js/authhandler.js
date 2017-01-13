//from: https://docs.microsoft.com/en-us/azure/notification-hubs/notification-hubs-chrome-push-notifications-get-started
var registrationId = "";
var hubName = "FactPopUpHub", connectionString = keys.azure_connection_string;
var originalUri = "", targetUri = "", endpoint = "", sasKeyName = "", sasKeyValue = "", sasToken = "";
var gcm_sender_id = keys.gcm_sender_id;
var refreshInterval = 24 * 60 * 60 * 1000;

var parser = new DOMParser();

function updateLog(status) {
    console.log(status);
}

function register() {
    document.getElementById("register").disabled = true;
    registerWithGCM();
}

function registerWithGCM() {
    chrome.gcm.register([gcm_sender_id], registerCallback);

    // Prevent register button from being clicked again before the registration finishes.
    document.getElementById("register").disabled = false;
}

function registerCallback(regId) {
    registrationId = regId;
    document.getElementById("register").disabled = false;

    if (chrome.runtime.lastError) {
        // When the registration fails, handle the error and retry the
        // registration later.
        updateLog("Registration failed: " + chrome.runtime.lastError.message);
        return;
    } else {
        registerWithNH(false);
        updateLog("Registration with GCM succeeded.");

        // Mark that the first-time registration is done.
        chrome.storage.local.set({
            registered: true,
            registrationId: regId,
        });
    }
}

function registerWithNH(update) {
    splitConnectionString();
    generateSaSToken();
    sendNHRegistrationRequest(update);
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
function sendNHRegistrationRequest(update) {
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

    var nhRegistrationId = "";
    chrome.storage.local.get("nhRegistrationId", function(resp) {
        if (resp.hasOwnProperty("nhRegistrationId")) {
            nhRegistrationId = resp.nhRegistrationId;
        }
    });

    var url = update
        ? originalUri + "/registrations/{NHRegistrationId}?api-version=2015-01".replace("{NHRegistrationId}", nhRegistrationId)
        : originalUri + "/registrations/?api-version=2014-09".replace("{GCMRegistrationId}", registrationId);
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
                setInterval(registerWithNH, refreshInterval, false);
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

    client.open(update ? "PUT" : "POST", url, true);
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

document.addEventListener('DOMContentLoaded', function () {
    var link = document.getElementById('register');
    // onClick's logic below:
    link.addEventListener('click', register);
});

function stopNotifications() {
    document.getElementById("start").removeAttribute("hidden");
    document.getElementById("stop").setAttribute("hidden", "true");
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