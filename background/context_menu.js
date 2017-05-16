chrome.contextMenus.create({
	type: "normal",
	id: "zync-upload",
	title: "Upload to Zync",
	contexts: [
		"selection",
		"link",
		"image",
		"video",
		"audio"
	],
	onclick: console.log,
	enabled: true
});
