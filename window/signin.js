const PROVIDERS = {
	google: firebase.auth.GoogleAuthProvider
}

/**
 * Assign click listener to signin button, and go through signin flow.
 * Skeleton function, to be fleshed out.
 *
 * @param provider String ID of the auth provider.
 */
function handleSignin(provider) {
	document.getElementById("signin-" + provider).addEventListener('click', function() {
		let provider = PROVIDERS[provider];
		
		firebase.auth().signInWithPoup(provider)
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