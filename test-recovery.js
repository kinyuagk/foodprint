const algosdk = require('algosdk');

const strictCompare = (a, b) => {
  console.log('\n=== Strict Comparison ===');
  console.log('Lengths:', a.length, 'vs', b.length);
  console.log('Char codes:');
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a.charCodeAt(i) !== b.charCodeAt(i)) {
      console.log(`Diff at ${i}: ${a.charCodeAt(i)} vs ${b.charCodeAt(i)}`);
    }
  }
  return a === b;
};

const testRecovery = (mnemonic, expectedAddress) => {
  try {
    const account = algosdk.mnemonicToSecretKey(mnemonic);
    const isExactMatch = account.addr === expectedAddress;
    
    console.log(`
      Mnemonic: ${mnemonic.split(' ').length} words
      Recovered: ${account.addr}
      Expected: ${expectedAddress}
      Exact Match: ${isExactMatch}
    `);
    
    // Add strict comparison
    console.log('Strict comparison result:', 
      strictCompare(account.addr, expectedAddress));
    
    return account.addr === expectedAddress;
  } catch (error) {
    console.error('Recovery failed:', error.message);
    return false;
  }
};