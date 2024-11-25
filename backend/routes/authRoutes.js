const express = require('express');
const { login, refreshToken } = require('../controllers/authController');

const router = express.Router();

// Login route
router.post('/login', login);

// Refresh token route
router.post('/refresh', refreshToken);

module.exports = router;
