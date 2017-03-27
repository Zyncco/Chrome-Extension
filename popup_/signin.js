firebase.initializeApp({
	apiKey: "AIzaSyA468GT4W0147Oz-uClJo0RCingBRo8q8A",
	authDomain: "zync-b3bce.firebaseapp.com",
	messagingSenderId: "3961871122"
});

providers = {
	google: firebase.auth.GoogleAuthProvider
}

var auth = firebase.auth();
var messaging = firebase.messaging();

function handle_signin(provider) {
	document.getElementById("signin-" + provider).addEventListener('click', () => {
		provider = new providers[provider]();

		auth.signInWithPopup(provider)
			.then(result => {
				return result.user.getToken();
			}).then(result => {
				return fetch("https://api.zync.co/v0/user/authenticate?token=" + result, {
					method: "GET",
					redirect: "follow"
				});
			}).then(result => {
				return result.json();
			}).then(console.log).catch(console.error);
	});
}

handle_signin("google");
