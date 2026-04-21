const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    supabaseId: { type: String, sparse: true },
    phone: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    role: { type: String, enum: ['vendor', 'buyer'], required: true },
    avatarUrl: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
