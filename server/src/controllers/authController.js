const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'smoketab_dev_secret_change_in_production';
const JWT_EXPIRES_IN = '30d';

// In-memory OTP store: { phone: { otp, expiresAt } }
const otpStore = new Map();
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

// Generate a 6-digit OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Create JWT token for a user
function createToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// POST /api/auth/send-otp
// Body: { phone: "9876543210" }
const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ error: 'Enter a valid 10-digit phone number' });
    }

    const otp = generateOtp();
    otpStore.set(phone, { otp, expiresAt: Date.now() + OTP_EXPIRY_MS });

    // TODO: Send OTP via SMS (Twilio / MSG91 / etc.)
    // For now, log to console so you can see it during development
    console.log(`\n📱 OTP for +91${phone}: ${otp}\n`);

    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/auth/verify-otp
// Body: { phone: "9876543210", otp: "123456" }
// Returns: { token, user, isNewUser }
const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone and OTP are required' });
    }

    const stored = otpStore.get(phone);

    if (!stored) {
      return res.status(400).json({ error: 'No OTP found for this number. Request a new one.' });
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(phone);
      return res.status(400).json({ error: 'OTP has expired. Request a new one.' });
    }

    if (stored.otp !== otp) {
      return res.status(400).json({ error: 'Incorrect OTP. Please try again.' });
    }

    // OTP verified — clear it
    otpStore.delete(phone);

    // Check if user already exists
    let user = await User.findOne({ phone });
    const isNewUser = !user;

    if (user) {
      // Returning user — generate token and send back
      const token = createToken(user._id);
      return res.json({ token, user, isNewUser: false });
    }

    // New user — send back a temporary registration token
    // They still need to pick a name and role
    const tempToken = jwt.sign({ phone, type: 'registration' }, JWT_SECRET, { expiresIn: '15m' });
    return res.json({ registrationToken: tempToken, isNewUser: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/auth/register
// Body: { name, role }
// Header: Authorization: Bearer <registrationToken>
// Creates user, returns JWT + user
const register = async (req, res) => {
  try {
    const { name, role } = req.body;
    if (!name || !role) {
      return res.status(400).json({ error: 'Name and role are required' });
    }
    if (!['vendor', 'buyer'].includes(role)) {
      return res.status(400).json({ error: 'Role must be "vendor" or "buyer"' });
    }

    // Extract phone from the registration token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Registration token required' });
    }
    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired registration token' });
    }

    if (decoded.type !== 'registration' || !decoded.phone) {
      return res.status(401).json({ error: 'Invalid registration token' });
    }

    const phone = decoded.phone;

    // Check if user was created between OTP verify and register (race condition)
    let user = await User.findOne({ phone });
    if (user) {
      const authToken = createToken(user._id);
      return res.json({ token: authToken, user });
    }

    // Create user
    user = await User.create({ phone, name: name.trim(), role });

    // If vendor, the shop will be created through shopRoutes
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

module.exports = { sendOtp, verifyOtp, register, getMe };
