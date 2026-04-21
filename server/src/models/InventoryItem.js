const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    name: { type: String, required: true },
    icon: { type: String, default: '🚬' },
    price: { type: Number, required: true }, // in paise
    category: {
      type: String,
      enum: ['cigarette', 'chai', 'gum', 'other'],
      default: 'cigarette',
    },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);
