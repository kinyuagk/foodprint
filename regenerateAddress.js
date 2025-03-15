const algosdk = require('algosdk');

// Convert private key from hex string to Uint8Array
const privateKey1 = Buffer.from("4fb5e3c6baffb2a5ac3e7320fd06df45668d83a3cc96a02a6170d1b6ea409a89e40c9c05542bd91c62030a1ba5641b6f7f6899625e2e7f60599af94b9d504185", "hex");
const privateKey2 = Buffer.from("a6a8c34452e8df7807ed7f03aab54e13519e99de62da89c59611954a7ec234b5902020924818602179e64b4e95927d8f64abe889f8c6671724788cf61ef2d541", "hex");

// Derive addresses from private keys
const address1 = algosdk.secretKeyToAddress(privateKey1);
const address2 = algosdk.secretKeyToAddress(privateKey2);

console.log("✅ Recovered Address 1:", address1);
console.log("✅ Recovered Address 2:", address2);
