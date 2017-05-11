const Zync = {};

Zync.encode = function () {
};

Zync.encrypt = function () {
};

Zync.deflate = function () {
};

Zync.inflate = function () {
};

Zync.decrypt = function () {
};

Zync.decode = function () {
};

window.Zync = window.Zync || Zync;

function zyncCopyHandler() {
    var bg = chrome.extension.getBackgroundPage();

    bg.document.body.innerHTML = "";

    var helper = null;
    var helperdiv = null;

    {
        helper = bg.document.createElement("textarea");
        helper.id = "helper";
        helper.style.position = "absolute";
        helper.style.border = "none";
        document.body.appendChild(helper);
    }

    {
        helperdiv = bg.document.createElement("div");
        helperdiv.contentEditable = true;
        document.body.appendChild(helperdiv);
    }

    helper.select();
    bg.document.execCommand("Paste");

    var data = helper.value;

    console.log("Copy listener: " + data);
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        if (tabs[0] === undefined) {
            // No window to report to.
        } else {
            chrome.tabs.sendMessage(tabs[0].id, data);
        }
    });
}

setInterval(zyncCopyHandler, 200);
