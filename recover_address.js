const algosdk = require('algosdk');

const mnemonic1 = "bag jacket write emerge deposit all keep vast sense merge twist fancy member bridge neutral escape cross tuna timber reward arrange casino salon able advice";
const mnemonic2 = "tuition wild zebra talent must together raw patrol path bless hero together food finish glide excite practice process toss term later fame situate abstract market";

const account1 = algosdk.mnemonicToSecretKey(mnemonic1);
const account2 = algosdk.mnemonicToSecretKey(mnemonic2);

console.log("✅ Account 1 Address:", account1.addr);
console.log("✅ Account 2 Address:", account2.addr);
