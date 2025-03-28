require('dotenv').config();
const express = require('express');
const router = express.Router();
const algosdk = require('algosdk');
const moment = require('moment');
const crypto = require('crypto');
const initModels = require('../models/init-models');
const sequelise = require('../config/db/db_sequelise');

const models = initModels(sequelise);

// ======================
// Enhanced Account Recovery
// ======================
console.log("\n🔍 Initializing Blockchain Account Recovery...");

// 1. Strict Validation Helpers
const validateMnemonic = (mnemonic, accountNum) => {
  if (!mnemonic) throw new Error(`Missing mnemonic for Account ${accountNum}`);
  
  const words = mnemonic.trim().normalize('NFKC').split(' ');
  if (words.length !== 25) {
    throw new Error(`Invalid mnemonic for Account ${accountNum}: Expected 25 words, got ${words.length}`);
  }
  return words.join(' ');
};

const validateAddress = (address) => {
  try {
    return algosdk.decodeAddress(address).publicKey;
  } catch (error) {
    throw new Error(`Invalid Algorand address: ${address}\n${error.message}`);
  }
};

// 2. Account Recovery with Enhanced Validation
let recoveredAccount1, recoveredAccount2;
try {
  console.log('\n🔐 Validating Mnemonics...');
  const mnemonic1 = validateMnemonic(process.env.ACCOUNT1_MNEMONIC, 1);
  const mnemonic2 = validateMnemonic(process.env.ACCOUNT2_MNEMONIC, 2);

  console.log('\n💽 Recovering Accounts...');
  recoveredAccount1 = algosdk.mnemonicToSecretKey(mnemonic1);
  recoveredAccount2 = algosdk.mnemonicToSecretKey(mnemonic2);

  // Binary Validation
  const expectedPubKey1 = validateAddress(process.env.ACCOUNT1_ADDRESS);
  const pubKey1 = validateAddress(recoveredAccount1.addr);

  if (Buffer.compare(pubKey1, expectedPubKey1) !== 0) {
    throw new Error('Recovered Account 1 does not match expected address');
  }

  console.log('✅ Account Recovery Successful:', {
    account1: recoveredAccount1.addr,
    account2: recoveredAccount2.addr
  });

} catch (error) {
  console.error('\n🚨 CRITICAL ACCOUNT RECOVERY ERROR:', error.message);
  console.log('\n💡 Troubleshooting Tips:');
  console.log('1. Verify .env contains valid 25-word mnemonics');
  console.log('2. Check ACCOUNT1_ADDRESS matches recovered address');
  console.log('3. Ensure no special characters in mnemonics');
  process.exit(1);
}

// ======================
// Algod Client Configuration (Simplified)
// ======================
console.log('\n🌐 Configuring Algod Client...');

const algodClient = new algosdk.Algodv2(
  process.env.TESTNET_ALGOD_API_KEY || '',
  process.env.TESTNET_ALGOD_SERVER || 'https://testnet-api.algonode.cloud',
  process.env.TESTNET_ALGOD_PORT || 443
);

// Test connection immediately
(async () => {
  try {
    const status = await algodClient.status().do();
    console.log(`✅ Algod Client Connected (Last Round: ${status['last-round']})`);
  } catch (error) {
    console.error('🚨 Algod Connection Failed:', error.message);
    process.exit(1);
  }
})();

// ======================
// Transaction Utilities
// ======================
const waitForConfirmation = async (txId, timeout = 4) => {
  const status = await algodClient.status().do();
  let currentRound = status['last-round'] + 1;
  const endRound = currentRound + timeout;

  while (currentRound < endRound) {
    const pendingInfo = await algodClient.pendingTransactionInformation(txId).do();
    
    if (pendingInfo['confirmed-round']) {
      return pendingInfo;
    }
    if (pendingInfo['pool-error']) {
      throw new Error(`Transaction rejected: ${pendingInfo['pool-error']}`);
    }
    
    await algodClient.statusAfterBlock(currentRound).do();
    currentRound++;
  }
  
  throw new Error(`Transaction not confirmed after ${timeout} rounds`);
};

const sendTransaction = async (txnData, sender) => {
  const params = await algodClient.getTransactionParams().do();
  const txn = {
    ...txnData,
    firstRound: params.firstRound,
    lastRound: params.lastRound,
    genesisID: params.genesisID,
    genesisHash: params.genesisHash
  };

  const signedTxn = algosdk.signTransaction(txn, sender.sk);
  const txId = signedTxn.txID;

  await algodClient.sendRawTransaction(signedTxn.blob).do();
  const confirmedTxn = await waitForConfirmation(txId);

  return {
    txId,
    confirmedRound: confirmedTxn['confirmed-round'],
    note: new TextDecoder().decode(confirmedTxn.txn.txn.note)
  };
};

// ======================
// Route Handlers
// ======================
router.get('/connection-status', async (req, res) => {
  try {
    const status = await algodClient.status().do();
    res.json({
      connected: true,
      network: 'TESTNET',
      lastRound: status['last-round'],
      nodeVersion: status.version
    });
  } catch (error) {
    res.status(500).json({
      connected: false,
      error: error.message
    });
  }
});

const handleBlockchainUpload = async (req, res, logType) => {
  try {
    const supplyChainData = JSON.stringify(req.body);
    const note = new TextEncoder().encode(supplyChainData);

    const result = await sendTransaction({
      from: recoveredAccount1.addr,
      to: recoveredAccount2.addr,
      fee: 1000,
      amount: 0,
      note
    }, recoveredAccount1);

    // Update database
    const updateData = {
      [`${logType}_BlockchainHashID`]: crypto.createHash('sha256').update(supplyChainData).digest('base64'),
      [`${logType}_BlockchainHashData`]: supplyChainData,
      [`${logType}_added_to_blockchain_date`]: moment().format('YYYY-MM-DD HH:mm:ss'),
      [`${logType}_bool_added_to_blockchain`]: true,
      [`${logType}_added_to_blockchain_by`]: req.user?.email || 'System',
      [`${logType}_blockchain_uuid`]: result.txId,
      blockchain_explorer_url: `https://goalseeker.purestake.io/algorand/testnet/transaction/${result.txId}`
    };

    await models[`Foodprint${logType.charAt(0).toUpperCase() + logType.slice(1)}`].update(
      updateData,
      { where: { [`${logType}_logid`]: req.body.logID } }
    );

    res.status(201).json({
      success: true,
      message: `${logType} entry added to blockchain`,
      transactionId: result.txId,
      explorerUrl: `https://goalseeker.purestake.io/algorand/testnet/transaction/${result.txId}`
    });

  } catch (error) {
    console.error(`Blockchain ${logType} Error:`, error);
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

router.post('/harvest/save', async (req, res) => handleBlockchainUpload(req, res, 'harvest'));
router.post('/storage/save', async (req, res) => handleBlockchainUpload(req, res, 'storage'));

module.exports = router;