// address-validator.js
const algosdk = require('algosdk');
require('dotenv').config();

const validate = (mnemonic) => {
  try {
    const account = algosdk.mnemonicToSecretKey(mnemonic);
    const address = algosdk.encodeAddress(account.addrPublicKey);
    return {
      address,
      length: address.length,
      validChecksum: algosdk.isValidAddress(address)
    };
  } catch (error) {
    return { error: error.message };
  }
};

console.log("Account 1:", validate(process.env.ACCOUNT1_MNEMONIC));
console.log("Account 2:", validate(process.env.ACCOUNT2_MNEMONIC));