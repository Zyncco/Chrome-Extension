import ZyncAPI from './api';

const google = document.querySelector('.zync-login-button');
const api = new ZyncAPI();

// LOGIN BUTTON
google.addEventListener('click', () => {
  transitionTo("loading", "intro");

  // always setup firebase before contacting the background script
  // this method will request permissions occasionally, so failing
  // shouldn't be too unexpected.
  //
  // we try to get the auth token without prompting the user
  // just in case they already logged in before
  api.setupFirebase().then((messagingToken) => startAuth(false));
});

function startAuth(interactive) {
  chrome.identity.getAuthToken({interactive: !!interactive}, function(token) {
    if (chrome.runtime.lastError && !interactive) {
      startAuth(true);
      console.log('It was not possible to get a token programmatically.');
    } else if(chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
    } else if (token) {
      sendMessage("login", {token}, (res) => {
        if (!res.success) {
          startAuth(interactive);
          return;
        }

        console.log("Login response!")
      })
    } else {
      console.error('The OAuth Token was null');
    }
  });
}

function transitionTo(to, from) {
  if (from) {
    document.querySelector("#" + from).style.transform = "translateX(-100%)";
  }

  document.querySelector("#" + to).style.transform = "translateX(0%)";
}

function sendMessage(method, message, callback) {
  message.method = method;
  chrome.runtime.sendMessage(
    message,
    callback
  );
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // we only need to handle loginSuccess
  if (message.method === "loginSuccess") {
    chrome.storage.local.get('encryptionPassword', (result) => {
      if (!result.encryptionPassword) {
        transitionTo("crypto-pass", "loading");
      } else {
        transitionTo("setup", "loading");
        sendMessage("setup", {});
      }
    });
  }
});

// START PASS HANDLING
document.querySelector('#password').addEventListener('keydown', (event) => {
  if ("Enter" === event.key) {
    event.preventDefault();
    handlePassEnter();
  }
})

document.querySelector('#pass-circle').addEventListener('click', (event) => {
  handlePassEnter();
})

function handlePassEnter() {
  const pass = document.querySelector('#password').value;

  if (pass.length < 10) {
    return;
  }

  transitionTo("loading-history", "crypto-pass")
  sendMessage("setPass", {pass, login: true}, (res) => transitionTo("setup", "loading-history"))
}

transitionTo("intro");