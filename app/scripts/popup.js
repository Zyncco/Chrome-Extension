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

    const history = res.history;
    const historyElement = document.querySelector('#history');
    var row;

    if (historyElement.hasChildNodes()) {
      historyElement.childNodes.forEach((node) => historyElement.removeChild(node));
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
        var text = document.createElement('span');
        text.classList.add("zync-history-text");
        text.textContent = clip.payload.data;

        contentContainer.appendChild(text);
      }

      // TODO actions

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

transitionTo("main");