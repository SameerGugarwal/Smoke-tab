const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    tabId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tab', required: true, index: true },
    amount: { type: Number, required: true }, // in paise
    method: { type: String, enum: ['upi', 'cash', 'other'], default: 'upi' },
    status: { type: String, enum: ['pending', 'confirmed'], default: 'pending' },
    upiRef: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
