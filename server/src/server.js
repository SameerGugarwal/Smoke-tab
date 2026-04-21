require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const socketHandler = require('./socket/socketHandler');
const { scheduleReminders } = require('./jobs/whatsappReminder');
const seedDummyData = require('./config/seed');

const PORT = process.env.PORT || 5001;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
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
