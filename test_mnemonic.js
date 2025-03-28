const algosdk = require('algosdk');

const mnemonic1 = "your 25-word mnemonic for account 1 here";
const mnemonic2 = "your 25-word mnemonic for account 2 here";

const account1 = algosdk.mnemonicToSecretKey(mnemonic1);
const account2 = algosdk.mnemonicToSecretKey(mnemonic2);

console.log("✅ Generated Account 1 Address:", account1.addr);
console.log("✅ Generated Account 2 Address:", account2.addr);
