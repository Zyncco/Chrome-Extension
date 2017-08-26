// Polyfill the Web Extensions API for Chrome and Opera
import browser from 'webextension-polyfill';
import pako from 'pako';
import base64 from 'base64-arraybuffer';

const encoder = new TextEncoder("utf-8");
const decoder = new TextDecoder("utf-8");

export default class Zync {
  constructor() {
    this.active = false;
    this.encryptionPassword = null;
    this["sync-down"] = true;
    this["sync-up"] = true;
    this["notify-clip-change"] = false;

    this.updateValues();
  }

  updateValues() {
    const settingsKeys = [
      'active',
      'encryptionPassword',
      'sync-up',
      'sync-down',
      'notify-clip-change'
    ]

    // Check storage to see whether or not Zync should be active
    browser.storage.local.get(settingsKeys).then((settings) => {
      settingsKeys.forEach((key) => this[key] = settings[key]);
    });
  }

  syncUp() {
    return this["sync-up"];
  }

  syncDown() {
    return this["sync-down"];
  }

  notifyClipChange() {
    return this["notify-clip-change"];
  }

  isTypeSupported(type) {
    return type === "TEXT" || type === "IMAGE";
  }

  setEncryptionPass(pass) {
    return sha256(pass).then((encryptionPassword) => {
      browser.storage.local.set({ encryptionPassword });

      this.encryptionPassword = encryptionPassword;
      return encryptionPassword;
    });
  }

  isActive() {
    return this.active;
  }

  setActive(active) {
    // Store value in browser storage for persistence
    browser.storage.local.set({ active });

    this.active = active;
  }

  encryptImage(data) {
    const encryptAlgo = {
      name: "AES-GCM",
      tagLength: 128,
      iv: generateRand(16)
    }

    return genKey(this.encryptionPassword).then((keyData) => {
      return crypto.subtle.encrypt(encryptAlgo, keyData.key, data)
                          .then((encrypted) => {
                            return {encrypted: encrypted, salt: keyData.salt, iv: encryptAlgo.iv};
                          })
    });
  }

  createTextPayload(data) {
    var payload = {};

    data = pako.gzip(data);
    payload.data = base64.encode(data);
    payload.hash = intFromBytes(data.slice(-8, -4).reverse());

    const buf = encoder.encode(JSON.stringify(payload));
    const encryptAlgo = {
      name: "AES-GCM",
      tagLength: 128,
      iv: generateRand(16)
    };

    return genKey(this.encryptionPassword).then((keyData) => {
      return crypto.subtle.encrypt(encryptAlgo, keyData.key, buf)
                          .then((encrypted) => this.preparePayload(encrypted, keyData.salt, encryptAlgo.iv, "TEXT"));
    })
  }

  preparePayload(payload, salt, iv, type) {
    if (type === undefined)
        type = "TEXT";

    const data = {};

    data.timestamp = Date.now();
    data.encryption = {};
    data.encryption.type = "AES256-GCM-NOPADDING";
    data.encryption.iv = base64.encode(iv);
    data.encryption.salt = base64.encode(salt);

    if (payload) {
      data.payload = base64.encode(payload);
    }

    data["payload-type"] = type;

    return data;
  }

  decrypt(payload, salt, iv) {
    const decryptAlgo = {
      name: "AES-GCM",
      length: 128,
      iv: db64(iv)
    };

    return genKey(this.encryptionPassword, db64(salt)).then((pwd) => {
      return crypto.subtle.decrypt(decryptAlgo, pwd.key, payload);
    })
  }

  // takes in
  // payload (base64ed encrypted string)
  // salt (base64'd)
  // iv (base64'd)
  // password
  decryptText(payload, salt, iv) {
    return this.decrypt(db64(payload), salt, iv)
               .then((decrypted) => decoder.decode(decrypted))
               .then((payload) => JSON.parse(payload))
               .then((payload) => {
                 payload.data = db64(payload.data);
                 payload.data = pako.ungzip(payload.data);
                 payload.data = decoder.decode(payload.data);

                 return payload;
                });
  }
}

// debase64
function db64(content) {
  if (content.endsWith("\\")) {
    content = content.substring(0, content.length - 1);
  }

  return base64.decode(content);
}

function intFromBytes(x) {
    var val = 0;
    for (var i = 0; i < x.length; ++i) {
        val += x[i] * 1;
        if (i < x.length - 1) {
            val *= 256;
        }
    }

    return val;
}


/**
 * Generates random values to be used as IV and hash.
 * @returns {*}
 */
function generateRand(len) {
    if (len === undefined) len = 16;
    return crypto.getRandomValues(new Uint8Array(len));
}

/**
 * Generates a key
 * @param password Password of the user
 * @param salt Generated salt
 * @returns {Promise} A promise of a data object with the key and salt.
 */
function genKey(password, salt) {
  if (salt === undefined) {
      salt = generateRand(25);
  }

  const pbkdfAlgo = {
      name: "PBKDF2",
      hash: "SHA-1",
      salt: salt,
      iterations: 1000
  };
  const keyGenAlgo = {
      name: "AES-GCM",
      length: 256
  };

  // Import the key as a CryptoKey to use as a master key.
  return crypto.subtle.importKey("raw", encoder.encode(password), {name: "PBKDF2"}, false, ["deriveKey"]).then((cryptoKey) => {
    return crypto.subtle.deriveKey(pbkdfAlgo, cryptoKey, keyGenAlgo, true, ["encrypt", "decrypt"]).then((finalKey) => {
      return {
        key: finalKey,
        salt: pbkdfAlgo.salt
      }
    })
  })
}

function sha256(str) {
  // We transform the string into an arraybuffer.
  var buffer = encoder.encode(str);
  return crypto.subtle.digest("SHA-256", buffer).then(function (hash) {
    return hex(hash);
  });
}

function hex(buffer) {
  var hexCodes = [];
  var view = new DataView(buffer);
  for (var i = 0; i < view.byteLength; i += 4) {
    // Using getUint32 reduces the number of iterations needed (we process 4 bytes each time)
    var value = view.getUint32(i)
    // toString(16) will give the hex representation of the number without padding
    var stringValue = value.toString(16)
    // We use concatenation and slice for padding
    var padding = '00000000'
    var paddedValue = (padding + stringValue).slice(-padding.length)
    hexCodes.push(paddedValue);
  }

  // Join all the hex strings into one
  return hexCodes.join("");
}
