import ZyncAPI from './api.js';
const firebase = ZyncAPI.firebase();
firebase.messaging();

firebase.messaging().setBackgroundMessageHandler((payload) => {
  return self.registration.showNotification("Firebase notification", {body: 'Zync has received a firebase notification', icon: '/images/icon48.png'})
})
