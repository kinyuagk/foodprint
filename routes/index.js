const express = require('express');
const path = require('path');
const router = express.Router();

// Serve frontend build files
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

// API fallback
router.get('/api', (req, res) => {
  res.json({ message: 'API root' });
});

module.exports = router;