const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'smoketab_dev_secret_change_in_production';
const JWT_EXPIRES_IN = '30d';

// Create JWT token for a user
function createToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Helper to calculate age
function calculateAge(dobStr) {
  const dob = new Date(dobStr);
  if (isNaN(dob.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

// ── Twilio WhatsApp setup ──
// Kept for future use
let twilioClient = null;
const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WA_FROM = process.env.TWILIO_WHATSAPP_FROM;

if (TWILIO_SID && TWILIO_TOKEN && TWILIO_WA_FROM) {
  try {
    const twilio = require('twilio');
    twilioClient = twilio(TWILIO_SID, TWILIO_TOKEN);
    console.log('✅ Twilio WhatsApp enabled (future use)');
  } catch (err) {
    console.warn('⚠️  Twilio SDK not installed');
  }
}

// POST /api/auth/login
// Body: { phone: "9876543210", dob: "1990-01-01" }
const login = async (req, res) => {
  try {
    const { phone, dob } = req.body;
    if (!phone || !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ error: 'Enter a valid 10-digit phone number' });
    }
    if (!dob) {
      return res.status(400).json({ error: 'Date of birth is required' });
    }

    const age = calculateAge(dob);
    if (age < 18) {
      return res.status(400).json({ error: 'You must be at least 18 years old to use Tab.' });
    }

    let user = await User.findOne({ phone });

    if (user) {
      // Returning user - check DOB
      if (user.dob !== dob) {
        return res.status(400).json({ error: 'Invalid Date of Birth for this number.' });
      }
      
      const token = createToken(user._id);
      return res.json({ token, user, isNewUser: false });
    }

    // New user - they need to complete registration (name, role)
    // We send back success, the frontend will prompt for name/role
    return res.json({ isNewUser: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/auth/register
// Body: { phone, dob, name, role }
const register = async (req, res) => {
  try {
    const { phone, dob, name, role, upiId } = req.body;
    if (!phone || !dob || !name || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (!['vendor', 'buyer'].includes(role)) {
      return res.status(400).json({ error: 'Role must be "vendor" or "buyer"' });
    }

    if (role === 'buyer') {
      if (!upiId || !/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upiId)) {
        return res.status(400).json({ error: 'A valid UPI ID is required for customers to settle tabs.' });
      }
    }

    const age = calculateAge(dob);
    if (age < 18) {
      return res.status(400).json({ error: 'You must be at least 18 years old to register.' });
    }

    // Check if user already exists
    let user = await User.findOne({ phone });
    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create user
    user = await User.create({ 
      phone, 
      dob, 
      name: name.trim(), 
      role,
      upiId: role === 'buyer' ? upiId.trim().toLowerCase() : undefined
    });

    const authToken = createToken(user._id);
    res.status(201).json({ token: authToken, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/auth/me (protected)
const getMe = async (req, res) => {
  res.json({ user: req.user });
};

// PUT /api/auth/upi (protected)
const updateUpi = async (req, res) => {
  try {
    const { upiId } = req.body;
    if (!upiId || !/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upiId)) {
      return res.status(400).json({ error: 'Invalid UPI ID format' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { upiId: upiId.trim().toLowerCase() },
      { new: true }
    );

    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { login, register, getMe, updateUpi };
