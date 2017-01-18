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
    //register();
    chrome.extension.sendMessage({
        start: "true"
    });
}

function openStreams() {
    chrome.tabs.create({ url: "streams.html" }, function (tab) {
        console.log("New tab launched with streams.html");
    });
}