/*
firebase.initializeApp({
	apiKey: "AIzaSyA468GT4W0147Oz-uClJo0RCingBRo8q8A",
	authDomain: "zync-b3bce.firebaseapp.com"
});
*/

firebase.initializeApp({
	apiKey: "AIzaSyBAmFUbMsY2nikroqOm0lpgJJAd7luYg90",
	authDomain: "zync-123456.firebaseapp.com"
});

providers = {
	google: firebase.auth.GoogleAuthProvider
}

function handle_error(error) {
	console.error(error);
}

function handle_signin(provider) {
	document.getElementById("signin-" + provider).addEventListener('click', () => {
		provider = new providers[provider]();

		firebase.auth().signInWithPopup(provider).then(result => {
			result.user.getToken().then(result => {
				fetch("https://api.zync.co/v0/user/callback?token=" + result, {
					method: "GET",
					mode: "no-cors",
					redirect: "follow"
				}).then(response => {
					return response.json();
				}).then(response => {
					console.log(response);
				}).catch(handle_error);
			}).catch(handle_error);
		}).catch(handle_error);
	});
}

handle_signin("google");
