document.getElementById("close").addEventListener("click", () => {
	chrome.tabs.getCurrent(tab => {
		chrome.tabs.remove(tab.id);
	});
});
