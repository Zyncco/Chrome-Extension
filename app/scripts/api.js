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

  /**
   * Register service worker, tell firebase to use it, and attempt to get the token.
   * 
   * The token request WILL fail from a background script if a page did not call this method beforehand. 
   * Notification permissions aside (as they can be granted through manifest), Firebase will try to
   * subscribe using GCM's PushManager and will be halted indefinitely.
   */
  setupFirebase() {
    return navigator.serviceWorker.register('/scripts/firebase-sw.js').then((registration) => {
      firebase.messaging().useServiceWorker(registration);
      return new Promise((resolve, reject) => {
        setTimeout(() => resolve(firebase.messaging().getToken()), 50);
      });
    });
  }

  requestRaw(route, data) {
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

    return fetch(url + route, data);
  }

  request(route, data) {
    return this.requestRaw(route, data)
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

  getHistory() {
    return this.request('/clipboard/history').then((response) => response.data);
  }

  getClipboard(timestamp) {
    var parsed = timestamp;

    if (parsed && parsed.join) {
      parsed = parsed.join(",");
    }

    var append = (timestamp ? ("/" + parsed) : '');
    return this.request('/clipboard' + append).then((response) => response.data);
  }

  postClipboard(data) {
    return this.post('/clipboard', {data});
  }

  requestUploadToken(data) {
    return this.post('/clipboard/upload', {data}).then((res) => res.data.token);
  }

  upload(request, token, data) {
    request.open("POST", url + "/clipboard/upload/" + token, true);
    request.setRequestHeader('X-ZYNC-TOKEN', this.token);
    request.send(data);

    return request;
  }

  downloadLarge(timestamp) {
    return this.requestRaw('/clipboard/' + timestamp + "/raw").then((res) => res.arrayBuffer());
  }

  static genericErrorManagement(res) {
    if (!res.success) {
      throw {code: res.code, errorMessage: res.reason};
    }

    return res;
  }
}
