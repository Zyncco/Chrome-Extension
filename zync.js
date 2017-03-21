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

var AES = {
	name: "AES-GCM",
	length: 128
}

// This value is required and must match for encryption and decryption!
var IV = crypto.getRandomValues(new Uint8Array(12));

function testEncryption(data, password) {
	crypto.subtle.importKey("raw", Zync.getArrayBuffer(password), "PBKDF2", false, ["deriveKey"])
		.then(key => {

			crypto.subtle.deriveKey({
				name: "PBKDF2",
				// This value is required, perhaps we should generate it from user ID
				salt: crypto.getRandomValues(new Uint8Array(16)),
				iterations: 10,
				hash: { name: "SHA-1" }
			}, key, AES, false, ["encrypt", "decrypt"]).then(key => {

				crypto.subtle.encrypt({
					name: "AES-GCM",
					iv: IV
				}, key, Zync.getArrayBuffer(data)).then(encrypted => {

					console.log(encrypted);
					console.log(String.fromCharCode.apply(null, new Uint16Array(encrypted)));

					crypto.subtle.decrypt({
						name: "AES-GCM",
						iv: IV
					}, key, encrypted).then(decrypted => {

						console.log(decrypted);
						console.log(String.fromCharCode.apply(null, new Uint16Array(decrypted)));

					}).catch(error => {
						console.error(error);
					});

				}).catch(error => {
					console.error(error);
				});

			}).catch(error => {
				console.error(error);
			});

		}).catch(error => {
			console.error(error);
		});
}

testEncryption("Mazen Kotb", "mazenpassword");
testEncryption("Brandon", "4r4f5 rtg£3$rfdfv");
testEncryption("Super long", "asjkdjejdfiouerjn43n4jh45uir8ufjefnb3nb45j54tiourfgbwe43jklrtuiofghebnnjre");
