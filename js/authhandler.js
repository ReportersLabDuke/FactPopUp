var cb = new Codebird;;
cb.setConsumerKey(keys.consumerKey, keys.consumerSecret);

document.addEventListener('DOMContentLoaded', function () {
    var link = document.getElementById('submitPin');
    // onClick's logic below:
    link.addEventListener('click', authorize);
});

document.addEventListener('DOMContentLoaded', function () {
    var link = document.getElementById('getPin');
    // onClick's logic below:
    link.addEventListener('click', getPin);
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
    chrome.extension.sendMessage({
        start: "true"
    });
}

function getPin() {
    document.getElementById("pin-load").removeAttribute("hidden");
    cb.setConsumerKey(keys.consumerKey, keys.consumerSecret);
    localStorage.authorized = "authorized";
    cb.__call(
        "oauth_requestToken",
        { oauth_callback: "oob" },
        function (reply, rate, err) {
            document.getElementById("pin-load").setAttribute("hidden", "true");
            if (err) {
                console.log("error response or timeout exceeded" + err.error);
            }
            if (reply) {
                // stores it
                cb.setToken(reply.oauth_token, reply.oauth_token_secret);
                localStorage.oauth_token = reply.oauth_token;
                localStorage.oauth_token_secret = reply.oauth_token_secret;

                // gets the authorize screen URL
                cb.__call(
                    "oauth_authorize",
                    {},
                    function (auth_url) {
                        window.codebird_auth = window.open(auth_url);
                    }
                );
            }
        }
    );
}

function authorize() {
    document.getElementById("submit-load").removeAttribute("hidden");
    cb.setToken(localStorage.oauth_token, localStorage.oauth_token_secret);
    cb.__call(
        "oauth_accessToken",
        { oauth_verifier: document.getElementById("PINFIELD").value },
        function (reply, rate, err) {
            document.getElementById("submit-load").setAttribute("hidden", "true");
            if (err) {
                console.log("error response or timeout exceeded" + err.error);
            }
            if (reply) {
                console.log(reply);
                // store the authenticated token, which may be different from the request token (!)
                cb.setToken(reply.oauth_token, reply.oauth_token_secret);
                localStorage.real_oauth_token = reply.oauth_token;
                localStorage.real_oauth_token_secret = reply.oauth_token_secret;
                chrome.extension.sendMessage({
                    oauth_token: reply.oauth_token,
                    oauth_token_secret: reply.oauth_token_secret
                });
                document.getElementById("success").removeAttribute("hidden");
                document.getElementById("stop").removeAttribute("hidden");
                document.getElementById("start").setAttribute("hidden", "true");
                chrome.tabs.create({ url: "streams.html" }, function (tab) {
                    console.log("New tab launched with streams.html");
                });
            }

            // if you need to persist the login after page reload,
            // consider storing the token in a cookie or HTML5 local storage
        }
    );
}

function openStreams() {
    chrome.tabs.create({ url: "streams.html" }, function (tab) {
        console.log("New tab launched with streams.html");
    });
}