if (!Zync.isSignedIn()) {
	chrome.tabs.create({ url: "/window/signin.html" })
}
