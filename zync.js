const Zync = {};

const ENCODER = new TextEncoder("utf-8");

/**
 *
 */
Zync.isSignedIn = function() {}

/**
 * Get AES-GCM encryption key for encryption / decryption based on type.
 *
 * @param type Type of encryption key to generate. 'encrypt' or 'decrypt'.
 * @param password Password used to derive the PBKDF2 key.
 * @param salt Salt used to derive the PBKDF2 key. Default: random
 * @returns {Promise} Promise containing JSON object containing the key and salt.
 */
Zync.getEncryptionKey = function(type, password, salt) {
	if (password == null || password === "") {
		throw "You must provide a password!";
	}
	
	if (type === "encrypt") {
		if (salt == null) {
			salt = ZyncUtil.getRandomValues(25);
		}
	} else if (type === "decrypt") {
		if (salt == null || iv == null) {
			throw "You must provide the 'salt' and 'iv' used to encrypt the data!";
		}
	} else {
		throw "Invalid encryption key type! Must be 'encrypt' or 'decrypt'.";
	}
	
	return new Promise(function (resolve, reject) {
		let PBKDF2 = ZyncUtil.getAlgoPBKDF2(salt);
		let AES_GCM = {
			name: "AES-GCM",
			length: 256
		};
		
		crypto.subtle.importKey("raw", ENCODER.encode(password), "PBKDF2", false, ["deriveKey"])
			.then(function(key) {
				return crypto.subtle.deriveKey(PBKDF2, key, AES_GCM, true, [type]);
			}).then(function(key) {
				resolve({
					key: key,
					salt: salt;
				});
			}).catch(reject);
	});
}

/**
 * Upload Step 1: Deflate the input data.
 */
Zync.deflate = function() {}

/**
 * Upload Step 2: Encrypt the deflated data.
 */
Zync.encrypt = function() {}

/**
 * Upload Step 3: Encode the encrypted data.
 *
 * @param data Uint8Array to be converted to base64.
 * @returns {String} Base64 representation of the Uint8Array.
 */
Zync.encode = function(data) {
	return btoa(String.fromCharCode.apply(null, data));
}

/**
 * Upload Step 4: Upload the encrypted data and the necessary metadata.
 */
Zync.upload = function() {}

/**
 * Download Step 1: Download the encrypted data and the necessary metadata.
 * Download Step 1b: Verify the downloaded data.
 */
 Zync.download = function() {}

/**
 * Download Step 2: Decode the downloaded data.
 *
 * @param data Base64 string to be converted to Uint8Array.
 * @returns {Uint8Array} Uint8Array representation of the base64 string.
 */
Zync.decode = function(data) {
	return atob(data);
}
 
 /**
 * Download Step 3: Decrypt the decoded data.
 */
Zync.decrypt = function() {}

/**
 * Download Step 4: Inflate the decrypted data.
 */
Zync.inflate = function() {}

// ---

window.Zync = window.Zync || Zync;
