const mongoose = require('mongoose');

const limitSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    limitType: { type: String, enum: ['daily_count', 'daily_amount'], required: true },
    limitValue: { type: Number, required: true }, // count or paise
    itemCategory: { type: String, enum: ['cigarette', 'all'], default: 'cigarette' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Limit', limitSchema);
