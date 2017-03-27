const Zync = {}

const encoder = new TextEncoder("utf-8");

Object.defineProperties(Zync, {
	"MINLEN_PASSWORD": {
		get: () => { return 10; },
		set: _ => { throw "Cannot override constant!"; }
	},
	"DEFLEN_SALT": {
		get: () => { return 25; },
		set: _ => { throw "Cannot override constant!"; }
	},
	"DEFLEN_IV": {
		get: () => { return 16; },
		set: _ => { throw "Cannot override constant!"; }
	}
})

/**
 * Storage (chrome.storage) Helper Functions
 */

function storageGet(key, callback, def) {
	// TODO: Find a way to stop this function from being available when script is included.
	if (typeof callback !== "function") { throw "You must provide a callback!"; }

	chrome.storage.local.get(key, result => {
		if (chrome.runtime.lastError) { throw chrome.runtime.lastError.message; }

		if (typeof (result = result[key]) === "undefined") {
			if (typeof def === "undefined") {
				throw "Storage value not found for key '" + key + "'!";
			} else {
				result = def;
			}
		}

		callback(result);
	});
}

function storageSet(key, value, type) {
	// TODO: Find a way to stop this function from being available when script is included.
	if (type && typeof value !== type) { throw "You must provide a " + type + " value!"; }

	chrome.storage.local.set({ [key]: value }, () => {
		if (chrome.runtime.lastError) { throw chrome.runtime.lastError.message; }
	})
}

Zync.isSignedIn = function (callback) {
	storageGet("signedIn", callback, false);
}

Zync.setSignedIn = function (input) {
	storageSet("signedIn", input, "boolean");
}

Zync.getToken = function (callback) {
	storageGet("token", callback);
}

Zync.setToken = function (input) {
	storageSet("token", input, "string");
}

Zync.getEncryptionPassword = function (callback) {
	storageGet("encryptionPassword", callback);
}

Zync.setEncryptionPassword = function (input) {
	if (typeof input !== "string" || input.lenth == 0) { throw "You must provide an encryption password!"; }
	if (input.length < Zync.MINLEN_PASSWORD) { throw "Encryption password must be at least " + Zync.MINLEN_PASSWORD + " characters!"; }

	storageSet("encryptionPassword", input);
}

/**
 *
 */

Zync.getEncryptionKey = function (password, salt) {
	if (typeof password === "undefined") {
		Zync.getEncryptionPassword(password => { return Zync.getEncryptionKey(password, salt); })
	}
	if (typeof salt === "undefined") {
		salt = crypto.getRandomValues(new Uint8Array(Zync.DEFLEN_SALT));
	}

	password = encoder.encode(password);

	let PBKDF2 = {
		name: "PBKDF2",
		salt: salt,
		iterations: 1000,
		hash: { name: "SHA-1" }
	}

	let AES_GCM = {
		name: "AES-GCM",
		length: 256
	}

	return crypto.subtle.importKey("raw", password, "PBKDF2", false, ["deriveKey"])
		.then(result => {
			return crypto.subtle.deriveKey(PBKDF2, result, AES_GCM, false, ["encrypt", "decrypt"]);
		}).then(result => {
			return Promise.resolve([result, salt]);
		});
}

/**
 * Zync Upload Steps (Deflate -> Encrypt -> Encode)
 */

Zync.deflate = function (input) {
	return pako.deflate(input);
}

Zync.encrypt = function (input) { }

Zync.encode = function (input) { }

/**
 * Zync Download Steps (Decode -> Decrypt -> Inflate)
 */

Zync.decode = function (input) { }

Zync.decrypt = function (input) { }

Zync.inflate = function (input) {
	return pako.inflate(input);
}

/**
 * Zync API Functions
 */

Zync.signin = function () {}

Zync.signout = function () {}
