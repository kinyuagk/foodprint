const algosdk = require('algosdk');

const newAccount = algosdk.generateAccount();
const mnemonic = algosdk.secretKeyToMnemonic(newAccount.sk);

console.log("New Address:", newAccount.addr);
console.log("New Mnemonic:", mnemonic);

