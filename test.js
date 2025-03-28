const algosdk = require('algosdk');
const mnemonic = "prepare mom gloom wing grass city voice industry piano brief usage gold bracket thought govern nothing favorite lucky return home step mother error above finger";
console.log(algosdk.mnemonicToSecretKey(mnemonic).addr);