// Automatic reloading for Chrome development
//import 'chromereload/devonly';

// Polyfill the Web Extensions API for Chrome and Opera
import browser from 'webextension-polyfill';

import Zync from './zync';
import ZyncAPI from './api';
import MessageHandler from './background-message-handler';

const zync = new Zync();
const api = new ZyncAPI();
const messageHander = new MessageHandler(zync, api);
// all the timestamps that the Extensions
// has already read
const readTimestamps = [0];
var loginCallback;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  return messageHander[message.method](message, sendResponse);
});

navigator.serviceWorker.register('/scripts/firebase-sw.js').then((registration) => {
  api.firebase().messaging().useServiceWorker(registration);
  console.log("registered firebase service worker");
}).catch((error) => console.log("error registering service worker " + error))

api.firebase().messaging().onMessage((payload) => {
  const data = payload.data;

  if (data['zync-token']) {
    const apiKey = data['zync-token'];
    const randomToken = data['random-token'];

    api.validateDevice(apiKey, randomToken).then((response) => {
      console.log("before");
      sendMessage("login", "loginSuccess", {});
      console.log("Successfully authenticated device! Completed login process");
    })
    return;
  }

  if (readTimestamps.indexOf(parseInt(data.timestamp, 10)) === -1) {
    api.getClipboard(data.timestamp).then((clip) => {
      zync.decrypt(clip.payload, clip.encryption.salt, clip.encryption.iv).then((payload) => {
        // todo consider activity button
        readTimestamps.push(data.timestamp);
        writeToClipboard(payload.data);
        sendNotification("Clipboard updated!", "New content has been written to your clipboard");
      }).catch((error) => console.log("Uh oh! " + error + "|" + chrome.runtime.lastError));
    })
  }
});

function sendMessage(page, method, message, callback) {
  message.method = method;

  if (page) {
    chrome.tabs.query({url: "chrome-extension://cjknenicmcobcbgpmjlmmmbplebhjcjm/pages/" + page + ".html"}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, message, callback);
    });
  } else {
    chrome.runtime.sendMessage(message, callback);
  }
}

function sendNotification(title, message) {
  chrome.notifications.create({
    type: "basic",
    iconUrl: '/images/icons/icon128.png',
    title,
    message,
  });
}

function writeToClipboard(text) {
  var copyFrom = document.createElement("textarea");
  copyFrom.textContent = text;
  var body = document.getElementsByTagName('body')[0];
  body.appendChild(copyFrom);
  copyFrom.select();
  document.execCommand('copy');
  body.removeChild(copyFrom);
}

var helper = null;
var last;

function zyncCopyHandler() {
    const first = last === undefined;
    var bg = chrome.extension.getBackgroundPage();

    if (helper === null || helper === undefined) {
        helper = bg.document.createElement("textarea");
        helper.id = "helper";
        helper.style.position = "absolute";
        helper.style.border = "none";
        document.body.appendChild(helper);
    } else {
        helper.value = "";
    }

    helper.select();
    bg.document.execCommand("Paste");

    var data = helper.value;
    if (data === last || first) {
        last = data;
        return;
    }

    last = data;

    if (api.token) {
      zync.createPayload(data).then((payload) => {
        readTimestamps.push(payload.timestamp);
        api.postClipboard(payload).then((res) => {
          if (res.success) {
            sendNotification("Clipboard posted!", "Your latest clip was posted successfully");
          }
        });
      });
    }
}

setInterval(zyncCopyHandler, 500);
