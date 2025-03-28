const express = require('express');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs').promises;
const nodemailer = require('nodemailer');
const router = express.Router();
const initModels = require('../models/init-models');
const sequelise = require('../config/db/db_sequelise');
const { ensureLoggedIn } = require('connect-ensure-login');
const CUSTOM_ENUMS = require('../utils/enums');
const ROLES = require('../utils/roles');
const customSendEmail = require('../config/email/email');

const models = initModels(sequelise);

// Constants
const QR_CODE_DIRECTORY = path.join(__dirname, '../static/qrcodes');
const ALLOWED_DOMAINS = ['http://www.google.com', 'https://yourdomain.com']; // Add your allowed domains

// Ensure QR code directory exists
(async () => {
  try {
    await fs.mkdir(QR_CODE_DIRECTORY, { recursive: true });
  } catch (err) {
    console.error('Failed to create QR code directory:', err);
  }
})();

/**
 * @swagger
 * /api/v1/qrcode/test_qrcode:
 *   post:
 *     summary: Generate a test QR code
 *     tags: [QRCode]
 *     responses:
 *       200:
 *         description: Returns the QR code data URL
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post('/test_qrcode', async (req, res, next) => {
  try {
    const { produceUrl = 'http://www.google.com', supplier = 'supplier', produce = 'Storage' } = req.body;

    // Validate URL
    if (!ALLOWED_DOMAINS.some(domain => produceUrl.startsWith(domain))) {
      return res.status(400).json({ error: 'Invalid URL domain' });
    }

    // Generate QR code
    const qrDataURL = await QRCode.toDataURL(produceUrl);
    const qrFileName = `${supplier}_${produce}_${Date.now()}.png`.replace(/\s+/g, '_');
    const qrFilePath = path.join(QR_CODE_DIRECTORY, qrFileName);

    // Save QR code to file (optional)
    const base64Data = qrDataURL.replace(/^data:image\/png;base64,/, '');
    await fs.writeFile(qrFilePath, base64Data, 'base64');

    res.json({
      success: true,
      qrDataURL,
      qrFilePath: `/qrcodes/${qrFileName}` // Public accessible path
    });
  } catch (error) {
    console.error('QR Code Generation Error:', error);
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/email/testemail:
 *   post:
 *     summary: Send a test email
 *     tags: [Email]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Email sent successfully
 *       400:
 *         description: Invalid email address
 *       500:
 *         description: Failed to send email
 */
router.post('/testemail', async (req, res) => {
  try {
    const { email = process.env.TEST_EMAIL_ADDRESS } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    const mailOptions = {
      to: email,
      subject: 'FoodPrint Test Email',
      html: `
        <h2>Welcome to FoodPrint</h2>
        <p>This is a test email sent from our system.</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
      `,
    };

    await customSendEmail(mailOptions.to, mailOptions.subject, mailOptions.html);
    
    res.json({ 
      success: true,
      message: 'Email successfully sent',
      recipient: email
    });
  } catch (error) {
    console.error('Email Send Error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to send email',
      details: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/test_config:
 *   get:
 *     summary: Test configuration (Admin only)
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Configuration test data
 *       403:
 *         description: Forbidden access
 *       500:
 *         description: Server error
 */
router.get('/test_config', 
  ensureLoggedIn({ redirectTo: '/app/auth/login' }), 
  async (req, res, next) => {
    try {
      if (![ROLES.Admin, ROLES.Superuser].includes(req.user.role)) {
        return res.status(403).render('error', {
          message: 'You are not authorized to view this resource.',
          title: 'Error',
          user: req.user,
          page_name: 'error',
        });
      }

      const harvestData = await models.FoodprintHarvest.findAll({
        order: [['pk', 'DESC']],
        limit: 50 // Added limit for safety
      });

      res.render('test_config', {
        page_title: 'Configuration Testing - FoodPrint',
        data: harvestData,
        user: req.user,
        page_name: 'test_config',
      });
    } catch (error) {
      console.error('Config Test Error:', error);
      next(error);
    }
  }
);

module.exports = router;