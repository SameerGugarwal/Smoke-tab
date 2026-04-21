const mongoose = require('mongoose');

let _mongod = null;

const connectDB = async () => {
  let uri = process.env.MONGODB_URI;

  // If no URI set (or it's the default localhost), try mongodb-memory-server
  if (!uri || uri === 'mongodb://localhost:27017/smoketab') {
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      _mongod = await MongoMemoryServer.create();
      uri = _mongod.getUri();
      console.log('Using in-memory MongoDB (dev mode)');
    } catch (memErr) {
      console.warn('mongodb-memory-server not available, trying local MongoDB');
      uri = uri || 'mongodb://localhost:27017/smoketab';
    }
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    console.warn('API will fail — set MONGODB_URI in server/.env or install mongodb-memory-server');
  }
};

module.exports = connectDB;
