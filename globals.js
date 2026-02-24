// 1. Core Polyfills MUST be initialized first!
global.Buffer = require('@craftzdog/react-native-buffer').Buffer;
global.process = require('process/browser.js');

// 2. Crypto Polyfills that depend on Buffer
require('react-native-quick-base64');
require('react-native-quick-crypto');

// Btoa/Atob Polyfills
if (typeof btoa === 'undefined') {
    global.btoa = function (str) {
        return new Buffer(str, 'binary').toString('base64');
    };
}

if (typeof atob === 'undefined') {
    global.atob = function (b64Encoded) {
        return new Buffer(b64Encoded, 'base64').toString('binary');
    };
}
