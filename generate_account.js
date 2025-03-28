// generate_account.js
const algosdk = require('algosdk');

// Generate account
const account = algosdk.generateAccount();
const mnemonic = algosdk.secretKeyToMnemonic(account.sk);

console.log("Address:", account.addr);
console.log("Mnemonic:", mnemonic);