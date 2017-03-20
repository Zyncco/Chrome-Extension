var Zync = {}
var Config = {
	apiURL: "https://api.zync.co/v0"
}

var headers = new Headers();

Zync.authenticate = function (id_token) {

}

Zync.getArrayBuffer = function (str) {
	let length = str.length;
	let result = new ArrayBuffer(length * 2);
	let bufferView = new Uint16Array(result);

	for (let i = 0; i < length; i++) {
		bufferView[i] = str.charCodeAt(i);
	}

	return result;
}

Zync.setEncryptionPassword = function (password) {
	return crypto.subtle.importKey("raw", Zync.getArrayBuffer(password), "AES-GCM", false, ["encrypt", "decrypt"])
		.then(function(key) {
			let iv = crypto.getRandomValues(new Uint8Array(12));

			return {
				key: key,
				iv: iv
			}
		});
}

/*
Zync.setEncryptionPassword('password').then(function(result) {
	chrome.storage.local.get("encryptionKey", function(result) {
		console.log(result);
	})
}).catch(function(error) {
	console.error(error);
})
*/

console.log(String.fromCharCode.apply(null, crypto.getRandomValues(new Uint8Array(12))));
