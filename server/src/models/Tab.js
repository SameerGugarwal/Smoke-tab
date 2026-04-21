const mongoose = require('mongoose');

const tabSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    balanceDue: { type: Number, default: 0 }, // in paise
  },
  { timestamps: true }
);

tabSchema.index({ shopId: 1, buyerId: 1 }, { unique: true });

module.exports = mongoose.model('Tab', tabSchema);
