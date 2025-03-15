const algosdk = require('algosdk');

// Replace these with your mnemonics
const mnemonic1 = "prepare mom gloom wing grass city voice industry piano brief usage gold bracket thought govern nothing favorite lucky return home step mother error above finger";
const mnemonic2 = "below attitude carbon lunch save taste habit lend document stove point bachelor device please black surprise raise force match power wish correct predict absent upon";

// Convert mnemonics to private keys
const account1 = algosdk.mnemonicToSecretKey(mnemonic1);
const account2 = algosdk.mnemonicToSecretKey(mnemonic2);

// Log the private keys (DO NOT expose these in production)
console.log("Private Key for Account 1:", Buffer.from(account1.sk).toString('hex'));
console.log("Private Key for Account 2:", Buffer.from(account2.sk).toString('hex'));

// Log the corresponding public addresses
console.log("Account 1 Address:", account1.addr);
console.log("Account 2 Address:", account2.addr);
