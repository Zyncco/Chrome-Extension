var helper = null;
var last;

export default class ClipboardListener {
    constructor(callback) {
        this.callback = callback;
        this.taskId = -1;
    }

    checkClipboard() {
        const first = last === undefined;
        var bg = chrome.extension.getBackgroundPage();
    
        if (helper === null || helper === undefined) {
            helper = bg.document.createElement("textarea");
            helper.id = "helper";
            helper.style.position = "absolute";
            helper.style.border = "none";
            document.body.appendChild(helper);
        } else {
            helper.value = "";
        }
    
        helper.select();
        bg.document.execCommand("Paste");
    
        var data = helper.value;

        if (data === last || first) {
            last = data;
            return;
        }
    
        last = data;
        this.callback(data);
    }
    
    listening() {
        return this.taskId != -1;
    }

    activate() {
        this.taskId = setInterval(this.checkClipboard.bind(this), 500);
    }

    deactivate() {
        clearInterval(this.taskId);
        this.taskId = -1;
    }
}