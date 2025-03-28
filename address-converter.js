// address-converter.js
const algosdk = require('algosdk');

const account1 = {
  publicKey: new Uint8Array([
    50, 152, 212,  26, 218, 232, 141, 251,
    66, 228,   2,  91, 146,  65, 161, 206,
    22,  47, 160,  33, 153,  74, 150,   6,
    51,  73,  39, 220,  40, 125, 219, 182
  ])
};

const account2 = {
  publicKey: new Uint8Array([
    244,  40, 227,  97, 253,  27, 121, 104,
     62, 233, 176, 111, 204, 135, 227,  12,
     71, 110,  30,  98, 179,  20,  86, 175,
    157, 136, 206,   5,   2,  94, 183, 250
  ])
};

console.log("ACCOUNT1_ADDRESS=" + algosdk.encodeAddress(account1.publicKey));
console.log("ACCOUNT2_ADDRESS=" + algosdk.encodeAddress(account2.publicKey));