const algosdk = require('algosdk');

// Generate first Algorand account
const account1 = algosdk.generateAccount();
const mnemonic1 = algosdk.secretKeyToMnemonic(account1.sk);

console.log("✅ Account 1 Generated:");
console.log("Address:", account1.addr);
console.log("Mnemonic:", mnemonic1);
console.log("\n----------------------------------\n");

// Generate second Algorand account
const account2 = algosdk.generateAccount();
const mnemonic2 = algosdk.secretKeyToMnemonic(account2.sk);

console.log("✅ Account 2 Generated:");
console.log("Address:", account2.addr);
console.log("Mnemonic:", mnemonic2);
