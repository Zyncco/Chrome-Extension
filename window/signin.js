const PROVIDERS = {
	google: firebase.auth.GoogleAuthProvider
}

firebase.initializeApp({
	"apiKey": "AIzaSyAp1jrV5OQn9yG-EScMWes827_EvpcQE68",
	"authDomain": "zyncco-f9dd0.firebaseapp.com",
	"messagingSenderId": "958433754089"
});

/**
 * Assign click listener to signin button, and go through signin flow.
 * Skeleton function, to be fleshed out.
 *
 * @param provider String ID of the auth provider.
 */
function handleSignin(provider) {
	document.getElementById("signin-" + provider).addEventListener('click', function() {
		provider = new PROVIDERS[provider]();
		
		firebase.auth().signInWithPopup(provider)
			.then(function (result) {
				return result.user.getToken();
			}).then(function (token) {
				// ZyncAPI.authenticate(token)
			}).then(function (response) {
				return response.json();
			}).then(function (response) {
				// Handle JSON response
			}).catch(ZyncUtil.handleCallbackError);
	});
}

handleSignin("google");