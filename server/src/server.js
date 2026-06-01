require('dotenv').config();

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! Shutting down...', err);
  process.exit(1);
});

const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const socketHandler = require('./socket/socketHandler');
const { scheduleReminders } = require('./jobs/whatsappReminder');
const seedDummyData = require('./config/seed');

const PORT = process.env.PORT || 5001;

const server = http.createServer(app);

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim());

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Attach io to app so controllers can access it via req.io
app.set('io', io);

socketHandler(io);

(async () => {
  await connectDB();
  await seedDummyData();
  scheduleReminders();

  server.listen(PORT, () => {
    console.log(`SmokeTab server running on port ${PORT}`);
    console.log('Auth: JWT-based OTP authentication');
  });
})();
