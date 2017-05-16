const ZyncUtil = {}

ZyncUtil.isSignedIn = function() {}

ZyncUtil.storageGetAll = function(prefix, callback) {
	chrome.storage.local.get(null, result => {
		if (prefix == undefined) {
			callback(result);
		} else {
			let all = {}
			
			Object.keys(result).forEach(key => {
				if (key.startsWith(prefix)) {
					all[key] = result[key]
				}
			});
			
			callback(all);
		}
	});
ZyncUtil.getAsset = function(path) {
	return chrome.runtime.getUrl("/assets/" + path);
}

ZyncUtil.handleCallbackError = function() {
	if (chrome.runtime.lastError) {
		console.error(chrome.runtime.lastError.message);
	}
}

window.ZyncUtil = window.ZyncUtil || ZyncUtil;
