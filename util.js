const ZyncUtil = {}

ZyncUtil.isSignedIn = function() {}

ZyncUtil.handleCallbackError = function() {
	if (chrome.runtime.lastError) {
		console.error(chrome.runtime.lastError.message);
	}
}

window.ZyncUtil = window.ZyncUtil || ZyncUtil;
