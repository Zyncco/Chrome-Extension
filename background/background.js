const CLIPBOARD_CURRENT = document.getElementById("clipboard-current");
const CLIPBOARD_PREVIOUS = document.getElementById("clipboard-previous");
const PATTERN_IGNORE = new RegExp("^<!--StartFragment-->.*<!--EndFragment-->$", "im");

function pasteHandler(event) {
	event.stopPropagation();
	event.preventDefault();
	
	let items = (event.clipboardData || event.originalEvent.clipboardData).items;
	let data = [];
	
	for (let i = 0; i < items.length; i++) {
		let item = items[i];
		
		if (item.kind === "file") {
			data.push(item.getAsFile());
		} else {
			console.log("item is string");
		}
	}
	
	if (data.length == 0) {
		console.log("data is empty");
	} else {
		console.log(data);
	}
}

function initializeBackground() {
	CLIPBOARD_CURRENT.addEventListener("paste", pasteHandler)
}

if (Zync.isSignedIn()) {
	initializeBackground();
} else {
	chrome.tabs.create({
		url: "/window/signin.html"
	});
}