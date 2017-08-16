import ZyncAPI from './api.js';
const google = document.querySelector('.zync-login-button');
var api = new ZyncAPI();

google.addEventListener('click', () => {
  const messaging = ZyncAPI.firebase().messaging();

  messaging.requestPermission().catch((error) => alert(JSON.stringify(error))).then(() => {
    messaging.getToken().then((messagingToken) => {
      startAuth(true, messagingToken);
    })
  });
});

window.addEventListener('load', () => {
  navigator.serviceWorker.register('/scripts/firebase-sw.js').then((registration) => {
    ZyncAPI.firebase().messaging().useServiceWorker(registration);
  }).catch((error) => console.log("error: " + error))
})

function startAuth(interactive, messagingToken) {
  chrome.identity.getAuthToken({interactive: !!interactive}, function(token) {
    if (chrome.runtime.lastError && !interactive) {
      console.log('It was not possible to get a token programmatically.');
    } else if(chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
    } else if (token) {
      var credential = ZyncAPI.firebase().auth.GoogleAuthProvider.credential(null, token);
      ZyncAPI.firebase().auth().signInWithCredential(credential).catch(function(error) {
        if (error.code === 'auth/invalid-credential') {
          chrome.identity.removeCachedAuthToken({token: token}, function() {
            startAuth(interactive, messagingToken);
          });
        }
      }).then((user) => {
        // todo loading screen
        //chrome.browserAction.setPopup({popup: "pages/main.html"});
        //window.location.href = "main.html";
        const firebaseMessaging = ZyncAPI.firebase().messaging();

        user.getToken(true).then((firebaseToken) => {
          api.authenticate(firebaseToken, messagingToken);
          console.log("Authenticated!");
        })

        console.log("Success!")
      });
    } else {
      console.error('The OAuth Token was null');
    }
  });
}
