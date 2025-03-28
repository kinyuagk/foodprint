var express = require('express');
const { check, validationResult, sanitizeParam } = require('express-validator');
const { Op, Sequelize } = require('sequelize');
var router = express.Router();
var initModels = require('../models/init-models');
var sequelise = require('../config/db/db_sequelise');
const CUSTOM_ENUMS = require('../utils/enums');
const { v4: uuidv4 } = require('uuid');
var ROLES = require('../utils/roles');
var QRCode = require('qrcode');
var moment = require('moment');
var models = initModels(sequelise);
var crypto = require('crypto');
const hash = crypto.createHash('sha256');
const env = process.env.NODE_ENV || 'development';
let fs = require('fs');
const path = require('path');

// Configure local storage for file uploads
const multer = require('multer');
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)){
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, req.body.qrcode_company_name + moment(new Date()).format('YYYY-MM-DD') + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB file size limit
  },
  fileFilter: function(req, file, cb) {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files (jpeg, jpg, png) are allowed!'));
  }
});

// Helper function to resolve local file URLs
const resolveLocalFilenames = (filename) => {
  return {
    fileUrl: `/uploads/${filename}`,
    filePath: path.join(__dirname, '../../uploads', filename)
  };
};

// [Keep all your existing routes...]

// Modified QR Code Save Route
router.post(
  '/qrcode/save',
  upload.single('qrcode_company_logo_uploaded_file'),
  [
    check('qrcode_company_name', 'Your company name is not valid').not().isEmpty().trim().escape(),
    // [Keep all other validators...]
  ],
  function (req, res) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      req.flash('error', result.array());
      return res.redirect('/app/qrcode');
    }

    try {
      let logoUrl = '';
      if (req.file) {
        const filenames = resolveLocalFilenames(req.file.filename);
        logoUrl = filenames.fileUrl;
      }

      // QR Code generation logic (keep existing)
      let host = req.get('host');
      let protocol = process.env.NODE_ENV === CUSTOM_ENUMS.DEVELOPMENT ? req.protocol : 'https';
      let supplier_product = (
        req.body.qrcode_company_name +
        '-' +
        req.body.qrcode_product_name +
        '-' +
        req.body.qrcode_contact_email
      ).split(' ').join('');
      let hashID = crypto.createHash('sha256').update(supplier_product).digest('hex');
      let qrURL = `${protocol}://${host}/app/qrcode/static/${hashID}`;

      let data = {
        qrcode_logid: uuidv4(),
        qrcode_company_name: req.body.qrcode_company_name,
        // [Keep all other fields...]
        qrcode_company_logo_url: logoUrl,
        // [Remaining fields...]
      };

      models.FoodprintQRCode.create(data)
        .then(() => {
          req.flash('success', 'QR Code saved successfully!');
          res.redirect('/app/qrcode');
        })
        .catch(err => {
          console.error('Database error:', err);
          req.flash('error', 'Failed to save QR Code');
          res.redirect('/app/qrcode');
        });

    } catch (e) {
      console.error('Error:', e);
      req.flash('error', 'An error occurred');
      res.redirect('/app/qrcode');
    }
  }
);

// [Keep all other existing routes...]

module.exports = router;