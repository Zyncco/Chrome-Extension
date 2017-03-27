firebase.initializeApp({
	apiKey: "AIzaSyA468GT4W0147Oz-uClJo0RCingBRo8q8A",
	authDomain: "zync-b3bce.firebaseapp.com",
	messagingSenderId: "3961871122"
});

document.getElementById("testing").addEventListener("click", () => {
	firebase.messaging().requestPermission()
		.then(() => {
			console.log("Granted");
		}).catch(console.error);
})
