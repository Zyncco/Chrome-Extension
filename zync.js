let last = "";
//let crypto = window.crypto;

const Zync = {};

const encoder =  new TextEncoder();
const decoder = new TextDecoder();

// Creates a CRC32 checksum

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
    return new Promise(
        function (resolve, reject) {
            let pbkdfAlgo = {
                name: "PBKDF2",
                hash: "SHA-256",
                salt: salt,
                iterations: 10000 // https://cryptosense.com/parameter-choice-for-pbkdf2/
            };
            let keyGenAlgo = {
                name: "AES-GCM",
                length: 256
            };

            // Import the key as a CryptoKey to use as a master key.
            crypto.subtle.importKey("raw", encoder.encode(password), {name: "PBKDF2"}, false, ["deriveKey"])
                .then(function (cryptoKey) {
                    // Create a key based on the master key above.
                    crypto.subtle.deriveKey(pbkdfAlgo, cryptoKey, keyGenAlgo, true, ["encrypt", "decrypt"])
                        .then(function (finalKey) {
                            let data = {};
                            data.key = finalKey;
                            data.salt = pbkdfAlgo.salt;

                            resolve(data);
                        }).catch(function (err) {
                            reject(err);
                        }
                    );
                }).catch(function (err) {
                    reject(err);
                }
            );
        });
}

function preparePayload(salt, iv, encrypted) {
    let payload = {};
    payload.timestamp = Date.now();
    payload.encryption = {};
    payload.encryption.type = "AES256-GCM-NOPADDING";
    payload.encryption.iv = iv;
    payload.encryption.salt = salt;
    payload.payload = encrypted;
    payload["payload-type"] = "TEXT";

    return payload;
}

Zync.encrypt = function (password, data) {
    let buf = encoder.encode(data);
    return new Promise(
        function (resolve, reject) {
            let encryptAlgo = {
                name: "AES-GCM",
                tagLength: 128,
                iv: generateRand(16),
            };
            genKey(password)
                .then(function (pwd) {
                    crypto.subtle.encrypt(encryptAlgo, pwd.key, buf)
                        .then(function (encrypted) {
                            let payload = preparePayload(pwd.salt, encryptAlgo.iv, encrypted);
                            resolve(payload);
                        }).catch(function (err) {
                            reject(err);
                        }
                    );
                }).catch(function (err) {
                    reject(err);
                }
            );
        });
};

Zync.decrypt = function (data, salt, iv, password) {
    return new Promise(
        function (resolve, reject) {
            let decryptAlgo = {
                name: "AES-GCM",
                tagLength: 128,
                iv: iv,

            };

            genKey(password, salt)
                .then(function (pwd) {
                    crypto.subtle.decrypt(decryptAlgo, pwd.key, data)
                        .then(function (decrypted) {
                            resolve(decoder.decode(decrypted));
                        }).catch(function (err) {
                            reject(err);
                        }
                    );
                }).catch(function (err) {
                    reject(err);
                }
            );
        });
};

window.Zync = window.Zync || Zync;

let helper = null;
let helperdiv = null;

function zyncCopyHandler() {


    let bg = chrome.extension.getBackgroundPage();

    if (helper === null || helper === undefined) {
        helper = bg.document.createElement("textarea");
        helper.id = "helper";
        helper.style.position = "absolute";
        helper.style.border = "none";
        document.body.appendChild(helper);
    } else {
        helper.value = "";
    }

    if (helperdiv === null || helperdiv === undefined) {
        helperdiv = bg.document.createElement("div");
        helperdiv.contentEditable = true;
        document.body.appendChild(helperdiv);
    }

    helper.select();
    bg.document.execCommand("Paste");

    let data = helper.value;
    if (data === last) {
        return;
    }
    last = data;

    Zync.encrypt("abcdef", data)
        .then(function (result) {
            console.log(result);
            Zync.decrypt(result.payload, result.encryption.salt, result.encryption.iv, "abcdef")
                .then(function (decrypted) {
                    console.log("Decrypted: " + decrypted);
                }).catch(function (err) {
                    console.log(err);
                }
            );
        }).catch(function (err) {
            console.log(err);
        }
    );
    console.log("Copy listener: " + data);
}

setInterval(zyncCopyHandler, 500);
