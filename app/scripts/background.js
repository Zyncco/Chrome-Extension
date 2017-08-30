// Automatic reloading for Chrome development
//import 'chromereload/devonly';

// Polyfill the Web Extensions API for Chrome and Opera
import browser from 'webextension-polyfill';
import base64 from 'base64-arraybuffer';

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

    setTimeout(() => {
      // find a more elegant way to check if a user was previously logged in
      if (this.zync.encryptionPassword) {
        this.attemptBackgroundLogin();
      }
    })
  }

  handleDecryptionError() {
    this.sendNotification("Error decrypting clip in history", "Ensure encryption password is the same on all devices", "zync_decrypt_error");
  }

  handleClipboardEvent(type, data) {
    if (this.zync.syncUp() && this.api.token && data && data !== this.lastRead) {
      var removeLoading = false;

      if (this.zync.notifyClipChange()) {
        this.sendNotification("Posting latest clip", "Please wait...", "zync_posting_clip");
        removeLoading = true;
      }

      if (type === "TEXT") {
        this.postText(removeLoading, data);
      } else if (type === "IMAGE") {
        this.postImage(removeLoading, data);
      }
    }
  }

  getImage(clip) {
    return this.api.downloadLarge(clip.timestamp)
            .then((buffer) => this.zync.decrypt(buffer, clip.encryption.salt, clip.encryption.iv))
            .then((decrypted) => base64.encode(decrypted))
            .then((payload) => {
              clip.payload = {data: payload};
              return clip;
            })
  }

  postImage(removeLoading, buf) {
    this.zync.encryptImage(buf).then((data) => {
      const clipPackage = this.zync.preparePayload(null, data.salt, data.iv, "IMAGE");

      this.readTimestamps.push(clipPackage.timestamp);
      this.api.requestUploadToken(clipPackage).then((uploadToken) => {
        if (removeLoading) {
          this.removeNotification("zync_posting_clip");
        }

        chrome.notifications.create("zync_image_upload", {
          type: "progress",
          iconUrl: '/images/icons/icon128.png',
          title: "Zync",
          message: "Uploading image from clipboard",
          progress: 0
        })

        var request = new XMLHttpRequest();

        request.upload.addEventListener('progress', (event) => {
          chrome.notifications.update("zync_image_upload", {progress: Math.round((event.loaded / event.total) * 100)});
        });

        request.addEventListener('load', (e) => {
          this.removeNotification("zync_image_upload");
          this.postClipboardPostedNotification();
        });

        this.api.upload(request, uploadToken, data.encrypted);
        clipPackage.payload = {data: base64.encode(buf)};
        this.appendToHistory(clipPackage);
      })
    })
  }

  postText(removeLoading, data) {
    this.zync.createTextPayload(data).then((payload) => {
      this.readTimestamps.push(payload.timestamp);
      this.api.postClipboard(payload).then((res) => {
        if (res.success) {
          if (removeLoading) {
            this.removeNotification("zync_posting_clip");
          }

          this.appendToHistory(payload);
          this.postClipboardPostedNotification();
        }
      });
    });
  }

  // post clipboard posted notif.
  // remove after five seconds later to avoid
  // notification center spam
  postClipboardPostedNotification() {
    if (this.zync.notifyClipChange()) {
      this.sendNotification(
        "Clipboard posted!",
        "Your latest clip was posted successfully",
        null,
        ((id) => {
          setTimeout(() => this.removeNotification(id), 5000);
        }).bind(this)
      );
    }
  }

  appendToHistory(clip) {
    // is the clip encrypted?
    if (clip.payload && !clip.payload.data && clip["payload-type"] === "TEXT") {
      // decrypt then append to history
      this.zync.decryptText(clip.payload, clip.encryption.salt, clip.encryption.iv).then((payload) => {
        clip.payload = payload;
        this.appendToHistory(clip);
      });
      return;
    }

    this.history.push(clip);

    if (this.history.length > 10) {
      this.history = this.history.slice(1, 11);
    }

    this.sortHistory();
    return clip;
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
        if (this.zync.encryptionPassword) {
          this.messageHandler.setup({}, (res) => {
            chrome.browserAction.setPopup({popup: "pages/popup/main.html"});
          });
        } else {
          chrome.browserAction.setPopup({popup: "pages/popup/main.html"});
        }

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

    if (!this.zync.syncDown()) {
      return;
    }

    data.encryption = JSON.parse(data.encryption);
  
    if (this.readTimestamps.indexOf(parseInt(data.timestamp, 10)) === -1) {
      if (data["payload-type"] === "TEXT") {
        this.api.getClipboard(data.timestamp).then(this.updateToClip.bind(this)).then(this.appendToHistory.bind(this));
      } else if (data["payload-type"] === "IMAGE") {
        this.getImage(data).then((clip) => {
          this.lastRead = clip.payload.data;
          this.appendToHistory(clip);

          if (this.zync.notifyClipChange()) {
            this.sendNotification("Clipboard updated!", "An image has been written to your clipboard", "zync_new_content");
          }
        })
      }
    }
  }

  updateToClip(clip) {
   return this.zync.decryptText(clip.payload, clip.encryption.salt, clip.encryption.iv).then((payload) => {
      this.readTimestamps.push(clip.timestamp);
      this.lastRead = payload.data;
      this.writeTextToClipboard(payload.data);

      if (this.zync.notifyClipChange()) {
        var preview = payload.data.split("\n")[0].trim();
        
        if (preview.length > 25) {
          preview = preview.substring(0, 23) + "…";
        }

        this.sendNotification("Clipboard updated!", "\"" + preview + "\" has been written to your clipboard", "zync_new_content");
      }

      return payload;
    }).catch((error) => console.log("Uh oh! " + error + "|" + chrome.runtime.lastError));
  }

  sendMessage(page, method, message, callback) {
    message.method = method;
  
    if (page) {
      chrome.tabs.query({url: "chrome-extension://*/pages/" + page + ".html"}, (tabs) => {
        if (tabs && tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, message, callback);
        }
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

  writeTextToClipboard(text) {
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

  attemptBackgroundLogin() {
    chrome.browserAction.setPopup({popup: "pages/popup/logging-in.html"});

    this.api.setupFirebase().then((messagingToken) => {
      chrome.identity.getAuthToken({interactive: false}, (authToken) => {
        if (chrome.runtime.lastError) {
          console.log("Could not login from the background because auth token wasn't given");
          return;
        }

        if (authToken) {
          const credential = this.api.firebase().auth.GoogleAuthProvider.credential(null, authToken);

          this.api.firebase().auth().signInWithCredential(credential)
                                    .catch((error) => console.log(JSON.stringify(error)))
                                    .then((user) => {
                                      user.getIdToken(true).then((firebaseToken) => {
                                        this.api.authenticate(firebaseToken, messagingToken);
                                      })
                                    });
        }
      });
    })
  }
}

export const instance = new Background();
