const ZyncUtil = {}

/**
 * Get the algorithm parameters for AES-GCM.
 *
 * @param iv Initialisation Value for AES encryption.
 * @returns {Object} JSON object containing parameters.
 */
ZyncUtil.getAlgoAESGCM = function(iv) {
	return {
		name: "AES-GCM",
		tagLength: 128,
		iv: iv
	};
}

/**
 * Get the algorithm paraneters for PBKDF2.
 *
 * @param salt Salt for HmacSHA sum of password.
 * @returns {Object} JSON object containing parameters.
 */
ZyncUtil.getAlgoPBKDF2 = function(salt) {
	return {
		name: "PBKDF2",
		hash: "SHA-256",
		iterations: 10000,
		salt: salt
	};
}

/**
 * Get random values using Web Extensions Crypto.
 *
 * @param length Length of Uint8Array containing random values. Default: 16
 * @returns {Uint8Array} Array of random values to be used as-is.
 */
ZyncUtil.getRandomValues = function (length) {
	if (typeof length !== "number") {
		length = 16;
	}
	
	return crypto.getRandomValues(new Uint8Array(length));
}

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
