const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { sendOtp, verifyOtp, register, getMe } = require('../controllers/authController');

// Public routes (no auth required)
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/register', register); // Uses registration token from verify-otp

// Protected routes
router.get('/me', auth, getMe);

module.exports = router;
