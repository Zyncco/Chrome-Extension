export default class MessageHandler {
  constructor(background) {
    this.zync = background.zync;
    this.api = background.api;
    this.background = background;
  }

  /**
   * Login to firebase. This will send you back a success response
   * when we have authenticated with firebase. Afterwards, the sender
   * (login.html) will have a message sent to it after messaging
   * handshake is complete.
   * 
   * This method requires that you have called ZyncAPI#setupFirebase()
   * on the page's end, as that would take care of specifically subscribing
   * to Firebase Messaging beforehand (PushManager#subscribe); a task which
   * you cannot do in the background script.
   */
  login(message, sendResponse) {
    this.api.setupFirebase().then((messagingToken) => {
      const token = message.token;
      var credential = this.api.firebase().auth.GoogleAuthProvider.credential(null, token);

      this.api.firebase().auth().signInWithCredential(credential).catch(function(error) {
        if (error.code === 'auth/invalid-credential') {
          chrome.identity.removeCachedAuthToken({token: token}, function() {
            sendResponse({success: false});
          });
        }
      }).then((user) => {
        user.getIdToken(true).then((firebaseToken) => {
          this.api.authenticate(firebaseToken, messagingToken);
          sendResponse({success: true});
        })
      });
    })

    return true;
  }

  getHistory(message, sendResponse) {
    sendResponse({history: this.background.history});
  }

  setPass(message, sendResponse) {
    this.zync.setEncryptionPass(message.pass).then((pass) => {
      sendResponse({success: true});

      // are we logging in? If so, get the latest clip
      // and activate clipboard listener.
      // we also need to be active. Don't want to be uselessly
      // running the clip listener and toying around when we're not
      // supposed to
      if (message.login && this.zync.isActive()) {
        this.api.getClipboard().then((clip) => {
          this.background.updateToClip(clip).then((payload) => {
            this.background.clipboardListener.activate();
          });
        });
      }

      this.api.getHistory().then((data) => {
        var timestamps = data.history.filter((x) => this.zync.isTypeSupported(x["payload-type"]))
                                     .map((x) => x.timestamp);
        
        this.api.getClipboard(timestamps).then((data) => {
          const clips = data.clipboards;
          var promises = [];

          clips.forEach((clip) => {
            promises.push(this.zync.decrypt(clip.payload, clip.encryption.salt, clip.encryption.iv).then((payload) => {
              clip.payload = payload;
              this.background.appendToHistory(clip);
            }))
          });

          Promise.all(promises).catch((error) => this.background.handleDecryptionError());
        })
      })
    });

    return true;
  }

  getActive(message, sendResponse) {
    sendResponse({active: this.zync.isActive()});
  }

  toggleActive(message, sendResponse) {
    const val = !this.zync.isActive();
    this.zync.setActive(val);
    this.background.updateActivity(val);

    console.log("Successfully set activity to " + val);
    sendResponse({success: true});
  }

  updateSettings(message, sendResponse) {
    this.zync.updateValues();
    sendResponse({success: true});
  }
}
