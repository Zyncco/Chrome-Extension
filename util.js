const ZyncUtil = {};

ZyncUtil.isSignedIn = function() {};

ZyncUtil.getAsset = function(path) {
	return chrome.runtime.getUrl("/assets/" + path);
};

ZyncUtil.handleCallbackError = function() {
	if (chrome.runtime.lastError) {
		console.error(chrome.runtime.lastError.message);
	}
};

window.ZyncUtil = window.ZyncUtil || ZyncUtil;
