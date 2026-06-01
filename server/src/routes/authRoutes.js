const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { login, register, getMe, updateUpi } = require('../controllers/authController');

// Public routes (no auth required)
router.post('/login', login);
router.post('/register', register); 

// Protected routes
router.get('/me', auth, getMe);
router.put('/upi', auth, updateUpi);

module.exports = router;
