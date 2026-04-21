const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    tabId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tab', required: true, index: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem' },
    itemName: { type: String, required: true },
    itemIcon: { type: String, default: '🚬' },
    category: { type: String, default: 'other' },
    quantity: { type: Number, default: 1 },
    amount: { type: Number, required: true }, // in paise
    addedBy: { type: String, default: 'vendor' },
    limitOverridden: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);
