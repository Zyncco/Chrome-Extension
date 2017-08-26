//Temporary thing to enable/ disable Zync animation
const activator = document.querySelector('.zync-activator');

// handle activator

activator.addEventListener('click', () => {
  activator.classList.toggle('active');

  sendMessage("toggleActive", {});
});

// initally set activity based on last setting
sendMessage("getActive", {}, (res) => {
  if (res.active) {
    activator.classList.add('active');
  } else {
    activator.classList.remove('active');
  }
});

// register the options in the menu to go to settings, history, etc.

document.querySelector("#settings-icon").addEventListener('click', () => {
  updateSettings();
  transitionMenu("settings", "main");
})

document.querySelector('#history-icon').addEventListener('click', () => {
  sendMessage("getHistory", {}, (res) => {
    if (!res || !res.history || res.history.length === 0) {
      return;
    }

    const history = res.history.filter((clip) => clip.payload && clip.payload.data);
    const historyElement = document.querySelector('#history-content');
    var row;

    while (historyElement.firstChild) {
      historyElement.removeChild(historyElement.firstChild);
  }

    for (var i = 1; i <= history.length; i++) {
      const clip = history[i - 1];

      // setup our main containers for the card
      var card = document.createElement('div');
      var contentContainer = document.createElement('div');
      var actionsContainer = document.createElement('div');

      card.classList.add("mdl-card", "mdl-shadow--2dp", "zync-history-entry");
      contentContainer.classList.add("zync-history-entry-container");
      actionsContainer.classList.add("zync-history-entry-actions", "mdl-card__actions", "mdl-card--border");

      // if we are at an odd position, create the row to use
      // otherwise, add a margin left of 5% to the card to
      // separate the two cards.
      if (i % 2 !== 0) {
        row = document.createElement('div');
        row.classList.add("zync-history-row");
      } else {
        card.style = "margin-left: 5%";
      }

      // if it's text, create the appropriate element and add it to the container
      if (clip["payload-type"] === "TEXT") {
        var content = clip.payload.data;

        const linkMatches = content.match(linkRegexExp);
        var text = document.createElement('div');
        text.classList.add("zync-history-text");
        
        if (!linkMatches) {
          text.textContent = clip.payload.data;
        } else {
          // create any a elements for any links in the text
          for (var j = 0; j < linkMatches.length; j++) {
            var match = linkMatches[j];
            var index = content.indexOf(match);
            var before = content.substring(0, index);

            // is there content before us? if so, add it
            if (before) {
              var beforeElement = document.createElement('div');
              beforeElement.textContent = before;
              text.appendChild(beforeElement);
            }
            
            // create the link itself
            var link = document.createElement('a');
            link.href = match;
            link.innerText = match;

            // add to our text area
            text.appendChild(link);

            // update content with everything after the link
            content = content.substring(index + match.length);

            // if we're the last element, append the rest of normal text content
            if (j === linkMatches.length - 1) {
              var afterElement = document.createElement('div');
              afterElement.textContent = content;
              text.appendChild(afterElement);
            }
          }
        }

        // add our text to the content container
        contentContainer.appendChild(text);

        const copyAction = document.createElement('i');
        copyAction.classList.add("zync-history-action", "material-icons", "md-dark");
        copyAction.innerHTML = "content_copy";
  
        copyAction.addEventListener('click', () => {
          writeToClipboard(clip.payload.data);
        });
  
        actionsContainer.appendChild(copyAction);
      }

      if (clip["payload-type"] === "IMAGE") {
        var image = document.createElement('img');

        image.src = "data:image/png;base64," + clip.payload.data;
        image.classList.add("zync-history-image");

        contentContainer.appendChild(image);
      }

      card.appendChild(contentContainer);
      card.appendChild(actionsContainer);

      row.appendChild(card);

      // if we are at an even position or at the last
      // entry, add our row to the history element
      if (i % 2 == 0 || i === history.length) {
        historyElement.appendChild(row);
      }
    }

    transitionMenu("history", "main");
  })
})

// Back icons

document.querySelector('#history-back').addEventListener('click', () => {
  transitionMenu("main", "history", true)
})

document.querySelector('#settings-back').addEventListener('click', () => {
  transitionMenu("main", "settings", true);
})

/*    FUNCTIONS START     */

// updates the settings thing with appropriate values
function updateSettings(register) {
  const storage = chrome.storage.local;
  const settingsKeys = [
    'sync-up',
    'sync-down',
    'notify-clip-change'
  ];

  if (register) {
    const dialog = document.querySelector('#password-dialog');
    const passElement = document.querySelector('#password');

    document.querySelector('#password-setting').addEventListener('click', () => {
      dialog.showModal();
    });

    document.querySelector('#password-submit-button').addEventListener('click', () => {
      var pass = passElement.value;

      if (passElement.value.length < 10) {
        return;
      }

      passElement.value = "";
      storage.set({encryptionPassword: pass}, () => {
        sendMessage('updateSettings', {});
      });
      dialog.close();
    });

    document.querySelector("#password-close-button").addEventListener('click', () => {
      dialog.close();
    })
  }

  storage.get(settingsKeys, (settings) => {
    settingsKeys.forEach((key) => {
      switch (key) {
        case 'sync-up':
        case 'sync-down':
        case 'notify-clip-change':
        var element = document.querySelector('#' + key + "-switch");

        updateSwitch(element, settings[key]);

        if (register) {
          element.addEventListener('click', () => {
            setTimeout(() => {
              var obj = {};
              obj[key] = element.classList.contains('is-checked');
              storage.set(obj, () => {
                sendMessage('updateSettings', {});
              });
            })
          });
        }

        return;
      }
    })
  });
}

function updateSwitch(element, val) {
  if (val) {
    if (!element.classList.contains("is-checked")) {
      element.classList.add('is-checked');
    }
  } else {
    element.classList.remove('is-checked');
  }
}

function sendMessage(method, message, callback) {
  message.method = method;
  chrome.runtime.sendMessage(
    message,
    callback
  );
}

function transitionMenu(to, from, exit) {
  if (to) {
    document.querySelector("#" + to).style.transform = "translateX(0%)";
  }

  if (from) {
    const val = (exit) ? 100 : -100;
    document.querySelector("#" + from).style.transform = "translateX(" + val + "%)";
  }
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

/*    FUNCTIONS END     */

// go to main menu and register settings
transitionMenu("main");
updateSettings(true);

// link regex for history
const linkRegexExp = new RegExp(/https?:\/\/[www\.]?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b[-a-zA-Z0-9@:%_\+.~#?&//=]*/g);