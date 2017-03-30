firebase.initializeApp({
	apiKey: "AIzaSyA468GT4W0147Oz-uClJo0RCingBRo8q8A",
	authDomain: "zync-b3bce.firebaseapp.com",
	messagingSenderId: "3961871122"
})

const auth = firebase.auth();
const messaging = firebase.messaging();

document.getElementById("signin-google").addEventListener("click", e => {
	let provider = new firebase.auth.GoogleAuthProvider();

	auth.signInWithPopup(provider).then(result => {
		console.log(result);

		return messaging.requestPermission();
	}).then(() => {
		console.log("Granted!");

		return messaging.getToken();
	}).then(console.log).catch(console.error);
});


