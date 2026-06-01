require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  try {
    const res = await User.updateMany(
      { dob: { $exists: false } },
      { $set: { dob: '1990-01-01' } }
    );
    console.log('Updated users:', res);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
});
