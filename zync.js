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

function storageGet(key, callback) {
	// TODO: Find a way to stop this function from being available when script is included.
	if (typeof callback !== "function") { throw "You must provide a callback to be called with the result!"; }

	chrome.storage.local.get(key, result => {
		if (chrome.runtime.lastError) { throw chrome.runtime.lastError.message; }

		if (key == null) { return callback(result); }

		let keys = Object.keys(result);

		if (keys.length == 0) { return callback(); }
		if (typeof key === "string") { return callback(result[key]); }
		if (key.length == 1) { return callback(result[keys[0]]); }

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
	storageGet("token", result => { callback(typeof result !== "undefined"); });
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

	// TODO: Sanity checks?

	if (typeof password === "string") { password = encoder.encode(password); }
	if (typeof salt === "undefined") { salt = crypto.getRandomValues(new Uint8Array(Zync.DEFLEN_SALT)); }

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
			// TODO: Return salt with key, or force salt generation outside of this function.
			return crypto.subtle.deriveKey(PBKDF2, result, AES_GCM, false, ["encrypt", "decrypt"]);
		});
}

/**
 * Zync Upload Steps (Deflate -> Encrypt -> Encode)
 */

Zync.deflate = function (input) {
	return pako.deflate(input);
}

Zync.encrypt = function (input, key, iv) {
	if (typeof input === "undefined") { throw "You must provide input to encrypt!"; }
	if (typeof key === "undefined") { throw "You must provide an encryption key!"; }

	// TODO: Sanity checks?

	if (typeof input === "string") { input = encoder.encode(input); }
	if (typeof iv === "undefined") { iv = crypto.getRandomValues(new Uint8Array(Zync.DEFLEN_IV)); }

	let AES_GCM = {
		name: "AES-GCM",
		iv: iv,
		tagLength: 128
	}

	//TODO: Return iv with encrypted data, or force iv generation outside of this function.
	return crypto.subtle.encrypt(AES_GCM, key, input);
}

Zync.encode = function (input) { }

/**
 * Zync Download Steps (Decode -> Decrypt -> Inflate)
 */

Zync.decode = function (input) { }

Zync.decrypt = function (input, key, iv) {
	if (typeof input === "undefined") { throw "You must provide input to decrypt!"; }
	if (typeof key === "undefined") { throw "You must provide a decryption key!"; }
	if (typeof iv === "undefined") { throw "You must provide the initialization value of the decryption key!"; }

	// TODO: Sanity checks?

	if (typeof input === "string") { input = encoder.encode(input); }

	let AES_GCM = {
		name: "AES-GCM",
		iv: iv,
		tagLength: 128
	}

	//TODO: Return iv with encrypted data, or force iv generation outside of this function.
	return crypto.subtle.decrypt(AES_GCM, key, input);
}

Zync.inflate = function (input) {
	return pako.inflate(input);
}

/**
 * Zync API Functions
 */

Zync.signin = function () { }

Zync.signout = function () { }
