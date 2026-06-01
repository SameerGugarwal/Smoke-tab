const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    supabaseId: { type: String, sparse: true },
    phone: { type: String, required: true, unique: true },
    dob: { type: String, required: true, default: '1990-01-01' }, // YYYY-MM-DD
    name: { type: String, required: true },
    role: { type: String, enum: ['vendor', 'buyer'], required: true },
    avatarUrl: { type: String },
    upiId: { 
      type: String, 
      trim: true,
      validate: {
        validator: function(v) {
          if (!v) return true; // Optional for vendors, required check handled in controller
          return /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(v);
        },
        message: props => `${props.value} is not a valid UPI ID!`
      }
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
