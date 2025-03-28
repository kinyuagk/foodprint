const algosdk = require('algosdk');

const testRecovery = (mnemonic, expectedAddress) => {
  try {
    const account = algosdk.mnemonicToSecretKey(mnemonic);
    const isValid = account.addr === expectedAddress;
    console.log(`
      Mnemonic: ${mnemonic.split(' ').length} words
      Recovered: ${account.addr}
      Expected: ${expectedAddress}
      Match: ${isValid}
    `);
    return isValid;
  } catch (error) {
    console.error('Recovery failed:', error.message);
    return false;
  }
};

// Test Account 1
const mnemonic1 = "prepare mom gloom wing grass city voice industry piano brief usage gold bracket thought govern nothing favorite lucky return home step mother error above finger";
const expected1 = "4QGJYBKUFPMRYYQDBIN2KZA3N57WRGLCLYXH6YCZTL4UXHKQIGCSVWAMN4";

// Test Account 2
const mnemonic2 = "below attitude carbon lunch save taste habit lend document stove point bachelor device please black surprise raise force match power wish correct predict absent upon";
const expected2 = "SAQCBESIDBQCC6PGJNHJLET5R5SKX2EJ7DDGOFZEPCGPMHXS2VATELPX7U";

testRecovery(mnemonic1, expected1);
testRecovery(mnemonic2, expected2);