const algosdk = require('algosdk');
require('dotenv').config(); // Load environment variables

console.log("🔍 DEBUG: Verifying mnemonic recovery...");

// Check if mnemonics exist
if (!process.env.ACCOUNT1_MNEMONIC || !process.env.ACCOUNT2_MNEMONIC) {
    console.error("❌ ERROR: One or both mnemonics are missing from .env!");
    process.exit(1);
}

// Trim whitespace to avoid errors
const mnemonics = [
    { phrase: process.env.ACCOUNT1_MNEMONIC.trim(), expected: process.env.ACCOUNT1_ADDRESS },
    { phrase: process.env.ACCOUNT2_MNEMONIC.trim(), expected: process.env.ACCOUNT2_ADDRESS }
];

mnemonics.forEach((mnemonic, index) => {
    try {
        const account = algosdk.mnemonicToSecretKey(mnemonic.phrase);
        console.log(`✅ Account ${index + 1} Address: ${account.addr}`);
        console.log(`🔍 Expected Address: ${mnemonic.expected}`);

        if (account.addr !== mnemonic.expected) {
            console.error(`❌ ERROR: Account ${index + 1} does not match the expected address!`);
        } else {
            console.log(`✅ Account ${index + 1} successfully verified.`);
        }
    } catch (error) {
        console.error(`❌ ERROR restoring Account ${index + 1}:`, error.message);
    }
});
