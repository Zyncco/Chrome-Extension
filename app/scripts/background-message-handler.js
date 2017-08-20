export default class MessageHandler {
  constructor(zync, api) {
    this.zync = zync;
    this.api = api;
  }

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

  setPass(message, sendResponse) {
    this.zync.setEncryptionPass(message.pass).then((pass) => {
      sendResponse({success: true});
    });

    return true;
  }
}
