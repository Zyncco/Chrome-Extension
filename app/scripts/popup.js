//Temporary thing to enable/ disable Zync animation
const activator = document.querySelector('.zync-activator');

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

document.querySelector('.toolbar-actions').addEventListener('click', () => {
  transitionTo("loading", "main");

  sendMessage("getHistory", {}, (res) => {
    if (res === undefined || res === null) {
      transitionTo("main", "loading");
      return;
    }

    const history = res.history.filter((clip) => clip.payload && clip.payload.data);
    const historyElement = document.querySelector('#history');
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
      }

      // TODO actions
      const copyAction = document.createElement('i');
      copyAction.classList.add("zync-history-action", "material-icons", "md-dark");
      copyAction.innerHTML = "content_copy";

      copyAction.addEventListener('click', () => {
        if (clip["payload-type"] === "TEXT") {
          writeToClipboard(clip.payload.data);
        }
      });

      actionsContainer.appendChild(copyAction);

      card.appendChild(contentContainer);
      card.appendChild(actionsContainer);

      row.appendChild(card);

      // if we are at an even position or at the last
      // entry, add our row to the history element
      if (i % 2 == 0 || i === history.length) {
        historyElement.appendChild(row);
      }
    }

    transitionTo("history", "loading");
  })
})

function sendMessage(method, message, callback) {
  message.method = method;
  chrome.runtime.sendMessage(
    message,
    callback
  );
}

function transitionTo(to, from) {
  if (from) {
    document.querySelector("#" + from).style.transform = "translateX(-100%)";
  }

  document.querySelector("#" + to).style.transform = "translateX(0%)";
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

transitionTo("main");

const linkRegexExp = new RegExp(/https?:\/\/[www\.]?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b[-a-zA-Z0-9@:%_\+.~#?&//=]*/g);