let initializeConfig = function() {
	chrome.storage.local.set({
		/* REST API URL */
		"api.url.scheme": "https",
		"api.url.domain": "beta-api.zync.co",
		"api.url.version": 0,
		"api.url.format": "{scheme}://{domain}/v{version}/{endpoint}",

		/* REST API Auth */
		"api.auth.header": "X-ZYNC-TOKEN",
		"api.auth.token": null,

		/* Encryption */
		"encryption.password": null,

		/* Firebase */
		"firebase.apiKey": "AIzaSyAp1jrV5OQn9yG-EScMWes827_EvpcQE68",
		"firebase.authDomain": "zyncco-f9dd0.firebaseapp.com",
		"firebase.messagingSenderId": "958433754089",

		/* History */
		"history": []
	});
}
