// Automatic reloading for Chrome development
//import 'chromereload/devonly';

// Polyfill the Web Extensions API for Chrome and Opera
import browser from 'webextension-polyfill';

import Zync from './zync';
import ZyncAPI from './api';
import MessageHandler from './background-message-handler';
import ClipboardListener from './clipboard-listener';

// all things background!
export default class Background {
  constructor() {
    this.zync = new Zync();
    this.api = new ZyncAPI();
    this.messageHandler = new MessageHandler(this);
    this.clipboardListener = new ClipboardListener(this.handleClipboardEvent.bind(this));
    // holds all the timestamps we've already read and processed
    this.readTimestamps = [0];
    // the last clip data we read from firebase
    // used to be ignored in clip event
    this.lastRead = "";
    this.history = [];

    // setup extension message handler
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      return this.messageHandler[message.method](message, sendResponse);
    });

    // setup firebase listener
    this.api.firebase().messaging().onMessage(this.handleFirebaseMessage.bind(this));
  }

  handleDecryptionError() {
    this.sendNotification("Error decrypting clip in history", "Ensure encryption password is the same on all devices", "zync_decrypt_error");
  }

  handleClipboardEvent(data) {
    if (this.api.token && data && data !== this.lastRead) {
      this.sendNotification("Posting latest clip", "Please wait...", "zync_posting_clip");

      this.zync.createPayload(data).then((payload) => {
        this.readTimestamps.push(payload.timestamp);
        this.api.postClipboard(payload).then((res) => {
          if (res.success) {
            this.removeNotification("zync_posting_clip");
            this.appendToHistory(payload);

            // post clipboard posted notif.
            // remove after five seconds later to avoid
            // notification center spam
            this.sendNotification(
              "Clipboard posted!",
              "Your latest clip was posted successfully",
              null,
              ((id) => {
                setTimeout(() => this.removeNotification(id), 5000);
              }).bind(this)
            );
          }
        });
      });
    }
  }

  appendToHistory(clip) {
    this.history.push(clip);

    if (this.history.length > 10) {
      this.history = this.history.slice(1, 11);
    }

    this.sortHistory();
  }

  sortHistory() {
    this.history.sort((a1, a2) => a2.timestamp - a1.timestamp);
  }

  handleFirebaseMessage(payload) {
    const data = payload.data;

    if (data['zync-token']) {
      const apiKey = data['zync-token'];
      const randomToken = data['random-token'];
  
      this.api.validateDevice(apiKey, randomToken).then((response) => {
        this.sendMessage("login", "loginSuccess", {});
        console.log("Successfully authenticated device! Completed login process");
      })
      return;
    }

    if (!this.api.token || !this.zync.encryptionPassword) {
      return;
    }

    if (!this.zync.isActive()) {
      return;
    }
  
    if (this.readTimestamps.indexOf(parseInt(data.timestamp, 10)) === -1) {
      this.api.getClipboard(data.timestamp).then(this.updateToClip.bind(this)).then(this.appendToHistory.bind(this));
    }
  }

  updateToClip(clip) {
   return this.zync.decrypt(clip.payload, clip.encryption.salt, clip.encryption.iv).then((payload) => {
      this.readTimestamps.push(clip.timestamp);
      this.lastRead = payload.data;
      this.writeToClipboard(payload.data);
      var preview = payload.data.split("\n")[0].trim();

      if (preview.length > 25) {
        preview = preview.substring(0, 23) + "…";
      }

      this.sendNotification("Clipboard updated!", "\"" + preview + "\" has been written to your clipboard", "zync_new_content");

      return payload;
    }).catch((error) => console.log("Uh oh! " + error + "|" + chrome.runtime.lastError));
  }

  sendMessage(page, method, message, callback) {
    message.method = method;
  
    if (page) {
      chrome.tabs.query({url: "chrome-extension://*/pages/" + page + ".html"}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, message, callback);
      });
    } else {
      chrome.runtime.sendMessage(message, callback);
    }
  }
  
  sendNotification(title, message, id, callback) {
    if (id === undefined || id === null) {
      id = "";
    }

    chrome.notifications.clear(id, (cleared) => {
      chrome.notifications.create(id, {
        type: "basic",
        iconUrl: '/images/icons/icon128.png',
        title,
        message
      }, callback);
    })
  }

  removeNotification(id) {
    chrome.notifications.clear(id);
  }

  writeToClipboard(text) {
    var copyFrom = document.createElement("textarea");
    copyFrom.textContent = text;
    var body = document.getElementsByTagName('body')[0];
    body.appendChild(copyFrom);
    copyFrom.select();
    document.execCommand('copy');
    body.removeChild(copyFrom);
  }

  updateActivity(activity) {
    if (activity) {
      if (!this.clipboardListener.listening()) {
        this.clipboardListener.activate();
      }
    } else {
      if (this.clipboardListener.listening()) {
        this.clipboardListener.deactivate();
      }
    }
  }
}

export const instance = new Background();
