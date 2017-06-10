const ZyncUtil = {}

/**
 * Send a notification to the extension "browser action" popup.
 *
 * @param type Type of notification. 'info', 'warning', 'error'
 * @param message String message of the notification.
 */
ZyncUtil.sendNotification = function (type, message) {
	if (["info", "warning", "error"].indexOf(type) == -1) {
		throw "Invalid notification type! 'info', 'warning' or 'error'";
	}
	
	chrome.runtime.sendMessage({
		purpose: "notification",
		type: type,
		message: message
	});
}

/**
 * Redirect error to a notification. If 'err' is not passed, checks
 * the last error Chrome threw.
 *
 * @param err Optional exception thrown (Promise.catch).
 */
ZyncUtil.handleCallbackError = function (err) {
	if (err) {
		ZyncUtil.sendNotification("error", err);;
	} else if (chrome.runtime.lastError) {
		ZyncUtil.sendNotification("error", chrome.runtime.lastError.message);
	}
}



ZyncUtil.storageGetAll = function(prefix, callback) {
	chrome.storage.local.get(null, result => {
		if (prefix === undefined) {
			callback(result);
		} else {
			let all = {};
			
			Object.keys(result).forEach(key => {
				if (key.startsWith(prefix)) {
					all[key] = result[key]
				}
			});
			
			callback(all);
		}
	});
}

ZyncUtil.getAsset = function(path) {
	return chrome.runtime.getUrl("/assets/" + path);
}

ZyncUtil.handleCallbackError = function() {
	if (chrome.runtime.lastError) {
		console.error(chrome.runtime.lastError.message);
	}
}

window.ZyncUtil = window.ZyncUtil || ZyncUtil;
