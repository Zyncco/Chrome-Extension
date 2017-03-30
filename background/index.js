Zync.isSignedIn(result => {
	if (!result) { chrome.tabs.create({ url: "/window/signin.html" }); }
})
