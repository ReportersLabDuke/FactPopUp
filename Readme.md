# FactPopUp

FactPopUp is a solution that provides Chrome notifications when a specified account tweets. It is intended to be used as a live fact checking solution.

FactPopUp contains a server component and a Chrome extension component. 
The server component uses Azure Notification Hubs and Firebase Cloud Messaging to send notifications when a specified account tweets. 
The client component registers with Notification Hubs and FCM to recieve and display notifications from the server. 
It also opens a livestream of a political event so that live fact checks can be viewed with the event:

![FactPopUp](https://pbs.twimg.com/media/CvLL5PfW8AAPOvt.jpg)

The extension can be installed from the Chrome Webstore [here](https://chrome.google.com/webstore/detail/factpopup/faaleponcnfhmolcbaajapgbigfffckj?hl=en "FactPopUp on Chrome Webstore").

FactPopUp a product of the Duke Reporters' Lab and is developed by Gautam Hathi.

## Repo and code details
This repo does not include the PolitiFact branding images which are in the version of the extension that is on the Chrome Webstore. **You'll need to add your own copy of logo.gif and logo.png in the politifact-extension-client directory to make the extension work.**

### Keys, IDs and connection strings
You'll also need your own server and client keys, ids and connection strings. 
The client needs a GCM sender id and a Azure Notification Hubs connection string with listen permissions.
These are stored in a keys.js file in the politifact-extension-client directory that should look something like this:

```javascript
var keys = {
  "azure_connection_string": "Endpoint=sb://xxxxxxxxxx.servicebus.windows.net/;SharedAccessKeyName=DefaultListenSharedAccessSignature;SharedAccessKey=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "gcm_sender_id": "123456789012"
};
```

The server needs a Twitter consumer key, a Twitter consumer secret, a Twitter access token, a Twitter access token secret and an Azure Notification Hubs connection string with full permissions.
These are stored in a server_keys.js file in the politifact-extension-server directory that should look something like this:

```javascript
module.exports = {
    consumer_key: 'xxxxxxxxxxxxxxxxxxxxxxxxx',
    consumer_secret: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    access_token: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    access_token_secret: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    connection_string: "Endpoint=sb://xxxxxxxxxx.servicebus.windows.net/;SharedAccessKeyName=DefaultFullSharedAccessSignature;SharedAccessKey=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
};
```

### Libraries
The extension uses [CryptoJS](https://github.com/sytelus/CryptoJS "CryptoJS"), which is Copyright (c) 2009-2013 Jeff Mott and made available under the license reproduced in the politifact-extension-client/lib/CryptoJS v3.1.2/copyright.txt file.

## License
Copyright 2016-present [Duke Reporters' Lab](https://reporterslab.org/ "Reporters' Lab").
This software is made available under the [GPLv3 License](https://www.gnu.org/licenses/gpl-3.0.en.html "GPLv3").
