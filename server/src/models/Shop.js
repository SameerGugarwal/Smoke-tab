const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const shopSchema = new mongoose.Schema(
  {
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    upiId: { type: String },
    qrToken: { type: String, default: uuidv4, unique: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Shop', shopSchema);
