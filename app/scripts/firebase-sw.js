import firebase from 'firebase';

firebase.initializeApp({
  messagingSenderId: "183678249083"
});

const messaging = firebase.messaging();

messaging.setBackgroundMessageHandler((payload) => {
  return self.registration.showNotification("Firebase notification", {body: 'Zync has received a firebase notification', icon: '/images/icon48.png'})
});
