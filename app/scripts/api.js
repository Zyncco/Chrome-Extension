import firebase from 'firebase';

const url = "https://beta-api.zync.co/v0"
var config = {
  apiKey: "AIzaSyDK1licbFo-a2SE-5jyAfpT4WfwKmQtD9I",
  authDomain: "zync-65973.firebaseapp.com",
  databaseURL: "https://zync-65973.firebaseio.com",
  projectId: "zync-65973",
  storageBucket: "zync-65973.appspot.com",
  messagingSenderId: "183678249083"
};
firebase.initializeApp(config);

export default class ZyncAPI {
  firebase() {
    return firebase;
  }

  static firebase() {
    return firebase;
  }

  setupFirebase() {
    return navigator.serviceWorker.register('/scripts/firebase-sw.js').then((registration) => {
      firebase.messaging().useServiceWorker(registration);
      return firebase.messaging().getToken();
    });
  }

  request(route, data) {
    if (!data) {
      data = {}
    }

    data.headers = {
      'Accept': 'text/plain',
      'Content-Type': 'text/plain',
    };

    if (this.token) {
      data.headers['X-ZYNC-TOKEN'] = this.token;
    }

    return fetch(url + route, data)
             .then((res) => res.json()).then((res) => ZyncAPI.genericErrorManagement(res));
  }

  post(route, body) {
    return this.request(route, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  authenticate(firebaseToken, messagingToken) {
    this.deviceId = messagingToken;
    return this.post('/user/authenticate', {
      data: {
        'device-id': messagingToken,
        'firebase-token': firebaseToken
      }
    });
  }

  validateDevice(zyncToken, randomToken) {
    this.token = zyncToken;
    return this.post('/device/validate', {
      data: {
        'device-id': this.deviceId,
        'random-token': randomToken
      }
    })
  }

  getClipboard(timestamp) {
    return this.request('/clipboard' + (timestamp ? ("/" + timestamp) : '')).then((response) => response.data);
  }

  postClipboard(data) {
    return this.post('/clipboard', {data});
  }

  static genericErrorManagement(res) {
    if (!res.success) {
      throw {code: res.code, errorMessage: res.reason};
    }

    return res;
  }
}
