require('dotenv').config();
const express = require('express');
const router = express.Router();
const algosdk = require('algosdk');
const moment = require('moment');
const crypto = require('crypto');
const { Op } = require('sequelize');
const initModels = require('../models/init-models');
const sequelise = require('../config/db/db_sequelise');

const models = initModels(sequelise);

// ======================
// Constants & Config
// ======================
const BLOCKCHAIN_NETWORK = process.env.BLOCKCHAINENV || 'TESTNET';
const TXN_WAIT_ROUNDS = 5;
const MIN_TXN_FEE = 1000; // microAlgos

// ======================
// Enhanced Validation Utilities
// ======================
const validateMnemonic = (mnemonic, accountNum) => {
  if (!mnemonic) throw new Error(`Account ${accountNum}: Missing mnemonic`);
  
  const words = mnemonic.trim().normalize('NFKC').split(' ');
  if (words.length !== 25) {
    throw new Error(`Account ${accountNum}: Invalid mnemonic length (${words.length} words)`);
  }
  
  try {
    algosdk.mnemonicToSecretKey(mnemonic);
  } catch (e) {
    throw new Error(`Account ${accountNum}: Invalid mnemonic - ${e.message}`);
  }
  
  return words.join(' ');
};

const validateNetworkConnection = async (client) => {
  try {
    const status = await client.status().do();
    return {
      connected: true,
      lastRound: status['last-round'],
      nodeVersion: status.version
    };
  } catch (error) {
    throw new Error(`Network connection failed: ${error.message}`);
  }
};

// ======================
// Blockchain Service Initialization
// ======================
console.log('\n🔍 Initializing Blockchain Service...');

// 1. Account Recovery with Validation
let accounts;
try {
  console.log('\n🔐 Validating Accounts...');
  const mnemonic1 = validateMnemonic(process.env.ACCOUNT1_MNEMONIC, 1);
  const mnemonic2 = validateMnemonic(process.env.ACCOUNT2_MNEMONIC, 2);

  accounts = {
    account1: algosdk.mnemonicToSecretKey(mnemonic1),
    account2: algosdk.mnemonicToSecretKey(mnemonic2)
  };

  console.log('✅ Accounts Validated:', {
    account1: accounts.account1.addr,
    account2: accounts.account2.addr
  });
} catch (error) {
  console.error('\n🚨 Account Validation Failed:', error.message);
  process.exit(1);
}

// 2. Algod Client Setup
const algodClient = new algosdk.Algodv2(
  process.env.TESTNET_ALGOD_API_KEY || '',
  process.env.TESTNET_ALGOD_SERVER || 'https://testnet-api.algonode.cloud',
  process.env.TESTNET_ALGOD_PORT || 443
);

// Verify connection immediately
(async () => {
  try {
    const { lastRound } = await validateNetworkConnection(algodClient);
    console.log(`🌐 ${BLOCKCHAIN_NETWORK} Connection Established (Round: ${lastRound})`);
  } catch (error) {
    console.error('🚨 Network Connection Failed:', error.message);
    process.exit(1);
  }
})();

// ======================
// Core Blockchain Utilities
// ======================
const waitForConfirmation = async (txId, roundsToWait = TXN_WAIT_ROUNDS) => {
  let status = await algodClient.status().do();
  let currentRound = status['last-round'] + 1;
  const endRound = currentRound + roundsToWait;

  while (currentRound < endRound) {
    try {
      const pendingInfo = await algodClient.pendingTransactionInformation(txId).do();
      
      if (pendingInfo['confirmed-round']) {
        return {
          confirmedRound: pendingInfo['confirmed-round'],
          txn: pendingInfo.txn.txn
        };
      }
      if (pendingInfo['pool-error']) {
        throw new Error(`Transaction rejected: ${pendingInfo['pool-error']}`);
      }
      
      await algodClient.statusAfterBlock(currentRound).do();
      currentRound++;
    } catch (error) {
      if (error.response?.status !== 404) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  throw new Error(`Transaction not confirmed after ${roundsToWait} rounds`);
};

const prepareTransaction = async (sender, receiver, note, amount = 0) => {
  const params = await algodClient.getTransactionParams().do();
  
  return algosdk.makePaymentTxnWithSuggestedParams(
    sender.addr,
    receiver.addr,
    amount,
    undefined,
    note,
    params
  );
};

const sendAndConfirmTransaction = async (txn, sender) => {
  const signedTxn = txn.signTxn(sender.sk);
  const txId = txn.txID().toString();

  await algodClient.sendRawTransaction(signedTxn).do();
  const result = await waitForConfirmation(txId);

  return {
    txId,
    confirmedRound: result.confirmedRound,
    note: result.txn.note ? new TextDecoder().decode(result.txn.note) : undefined
  };
};

// ======================
// Route Handlers
// ======================

/**
 * @swagger
 * /blockchain/status:
 *   get:
 *     summary: Check blockchain connection status
 *     tags: [Blockchain]
 *     responses:
 *       200:
 *         description: Blockchain status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 connected:
 *                   type: boolean
 *                 network:
 *                   type: string
 *                 lastRound:
 *                   type: number
 *                 nodeVersion:
 *                   type: string
 */
router.get('/status', async (req, res) => {
  try {
    const status = await validateNetworkConnection(algodClient);
    res.json({
      connected: true,
      network: BLOCKCHAIN_NETWORK,
      ...status
    });
  } catch (error) {
    res.status(503).json({
      connected: false,
      error: error.message
    });
  }
});

const handleBlockchainUpload = async (req, res, logType) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Request body cannot be empty' 
    });
  }

  try {
    // 1. Prepare transaction
    const note = new TextEncoder().encode(JSON.stringify(req.body));
    const txn = await prepareTransaction(
      accounts.account1,
      accounts.account2,
      note,
      0
    );

    // 2. Send to blockchain
    const result = await sendAndConfirmTransaction(txn, accounts.account1);
    const dataHash = crypto.createHash('sha256').update(note).digest('hex');

    // 3. Update database
    const modelName = `Foodprint${logType.charAt(0).toUpperCase() + logType.slice(1)}`;
    const updateResult = await models[modelName].update(
      {
        [`${logType}_BlockchainHashID`]: dataHash,
        [`${logType}_BlockchainHashData`]: req.body,
        [`${logType}_added_to_blockchain_date`]: moment().toISOString(),
        [`${logType}_bool_added_to_blockchain`]: true,
        [`${logType}_added_to_blockchain_by`]: req.user?.email || 'System',
        [`${logType}_blockchain_uuid`]: result.txId,
        blockchain_explorer_url: `https://goalseeker.purestake.io/algorand/testnet/transaction/${result.txId}`
      },
      { 
        where: { 
          [`${logType}_logid`]: req.body.logID 
        },
        returning: true
      }
    );

    if (updateResult[0] === 0) {
      throw new Error('Database update failed - record not found');
    }

    res.status(201).json({
      success: true,
      message: `${logType} entry committed to blockchain`,
      transactionId: result.txId,
      explorerUrl: `https://goalseeker.purestake.io/algorand/testnet/transaction/${result.txId}`,
      dataHash
    });

  } catch (error) {
    console.error(`[Blockchain Error] ${logType} Upload:`, error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * @swagger
 * /blockchain/harvest/save:
 *   post:
 *     summary: Save harvest data to blockchain
 *     tags: [Blockchain]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               logID:
 *                 type: string
 *                 description: The harvest log ID
 *     responses:
 *       201:
 *         description: Harvest data saved to blockchain
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Blockchain error
 */
router.post('/harvest/save', 
  express.json(),
  async (req, res) => handleBlockchainUpload(req, res, 'harvest')
);

/**
 * @swagger
 * /blockchain/storage/save:
 *   post:
 *     summary: Save storage data to blockchain
 *     tags: [Blockchain]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               logID:
 *                 type: string
 *                 description: The storage log ID
 *     responses:
 *       201:
 *         description: Storage data saved to blockchain
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Blockchain error
 */
router.post('/storage/save', 
  express.json(),
  async (req, res) => handleBlockchainUpload(req, res, 'storage')
);

module.exports = router;