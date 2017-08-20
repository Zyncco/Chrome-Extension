import ZyncAPI from './api';

const google = document.querySelector('.zync-login-button');
const api = new ZyncAPI();

// LOGIN BUTTON
google.addEventListener('click', () => {
  transitionTo("loading", "intro");

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
    chrome.browserAction.setPopup({popup: "pages/popup/main.html"});
    transitionTo("crypto-pass", "loading");
  }
});

// START PASS HANDLING
document.querySelector('#password').addEventListener('keydown', (event) => {
  if ("Enter" === event.key) {
    event.preventDefault();
    const pass = document.querySelector('#password').value;

    if (pass.length < 10) {
      return;
    }

    sendMessage("setPass", {pass}, (res) => transitionTo("setup", "crypto-pass"))
  }
})

// open intro
transitionTo("intro");
