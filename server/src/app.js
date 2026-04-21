const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(helmet());

// Allow multiple origins (comma-separated in CLIENT_URL env var)
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all in dev; tighten in production if needed
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(morgan('dev'));

// Attach socket.io to req (set in server.js)
app.use((req, res, next) => {
  req.io = app.get('io');
  next();
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/shops', require('./routes/shopRoutes'));
app.use('/api/tabs', require('./routes/tabRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/limits', require('./routes/limitRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

module.exports = app;
