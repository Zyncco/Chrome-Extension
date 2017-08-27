import base64 from 'base64-arraybuffer';

var helper = null;
var last;

export default class ClipboardListener {
    constructor(callback) {
        this.callback = callback;
        this.taskId = -1;
    }

    checkClipboard() {
        var bg = chrome.extension.getBackgroundPage();

        if (helper === null || helper === undefined) {
            helper = bg.document.createElement("div");
            helper.id = "helper";
            helper.style.position = "absolute";
            helper.style.border = "none";
            helper.contentEditable = true;
            document.body.appendChild(helper);

            helper.addEventListener('paste', (event) => {
                event.preventDefault();
                
                var first = last === undefined;
                const clipItem = event.clipboardData.items[event.clipboardData.items.length - 1];

                if (clipItem.type.indexOf("image") !== -1) {
                    var blob = clipItem.getAsFile();
                    
                    var fileReader = new FileReader();

                    fileReader.readAsDataURL(blob);
                    fileReader.addEventListener('loadend', (e) => {
                        var result = fileReader.result;

                        if (result === last || first) {
                            last = result;
                            return;
                        }

                        last = result;

                        result = result.substring(result.indexOf("base64,") + 7);
                        result = base64.decode(result);
                        this.callback("IMAGE", result);
                    })
                } else if (clipItem.type.indexOf("text") !== -1) {
                    const data = event.clipboardData.getData("text/plain");

                    if (data === last || first) {
                        last = data;
                        return;
                    }

                    this.callback("TEXT", data);
                    last = data;
                }
            })
        } else {
            helper.textContent = "";
        }
    
        helper.focus();
        bg.document.execCommand("Paste");
    }
    
    listening() {
        return this.taskId != -1;
    }

    activate() {
        this.taskId = setInterval(this.checkClipboard.bind(this), 1000);
    }

    deactivate() {
        clearInterval(this.taskId);
        this.taskId = -1;
    }
}