// mnemonic-debugger.js
require('dotenv').config();
console.log("Raw Mnemonics:");
console.log("ACCOUNT1:", process.env.ACCOUNT1_MNEMONIC?.length, "chars");
console.log("ACCOUNT2:", process.env.ACCOUNT2_MNEMONIC?.length, "chars");

// Hex dump to find hidden characters
const toHex = (str) => Buffer.from(str).toString('hex');
console.log("ACCOUNT1 HEX:", toHex(process.env.ACCOUNT1_MNEMONIC || ""));
console.log("ACCOUNT2 HEX:", toHex(process.env.ACCOUNT2_MNEMONIC || ""));