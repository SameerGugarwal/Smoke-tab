const Payment = require('../models/Payment');
const Tab = require('../models/Tab');
const Shop = require('../models/Shop');

// Record a payment (buyer initiates)
const recordPayment = async (req, res) => {
  try {
    const { tabId, amount, method = 'upi', upiRef } = req.body;
    if (!tabId || !amount) return res.status(400).json({ error: 'tabId and amount required' });

    const tab = await Tab.findById(tabId);
    if (!tab) return res.status(404).json({ error: 'Tab not found' });

    const payment = await Payment.create({ tabId, amount, method, upiRef, status: 'pending' });
    
    // Emit socket event to notify vendor of pending payment
    req.io?.to(`tab:${tabId}`).emit('tab:payment-initiated', { payment });
    
    res.status(201).json({ payment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Vendor confirms payment received
const confirmPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findByIdAndUpdate(
      paymentId,
      { status: 'confirmed' },
      { new: true }
    );
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    const tab = await Tab.findById(payment.tabId);
    if (tab) {
      tab.balanceDue = Math.max(0, tab.balanceDue - payment.amount);
      await tab.save();

      req.io?.to(`tab:${tab._id}`).emit('tab:payment-received', { payment, tab });
      req.io?.to(`user:${tab.buyerId}`).emit('tab:payment-received', { payment, tab });
    }

    res.json({ payment, tab });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get payments for a tab
const getTabPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ tabId: req.params.tabId }).sort({ createdAt: -1 });
    res.json({ payments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// Get all payments for a vendor
const getVendorPayments = async (req, res) => {
  try {
    const shop = await Shop.findOne({ vendorId: req.user._id });
    if (!shop) return res.status(404).json({ error: 'No shop found' });

    const tabs = await Tab.find({ shopId: shop._id });
    const tabIds = tabs.map(t => t._id);

    const payments = await Payment.find({ tabId: { $in: tabIds } })
      .populate({
        path: 'tabId',
        populate: { path: 'buyerId', select: 'name phone avatarUrl' }
      })
      .sort({ createdAt: -1 });

    res.json({ payments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all payments for a buyer
const getBuyerPayments = async (req, res) => {
  try {
    const tabs = await Tab.find({ buyerId: req.user._id });
    const tabIds = tabs.map(t => t._id);

    const payments = await Payment.find({ tabId: { $in: tabIds } })
      .populate({
        path: 'tabId',
        populate: { path: 'shopId', select: 'name upiId' }
      })
      .sort({ createdAt: -1 });

    res.json({ payments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { recordPayment, confirmPayment, getTabPayments, getVendorPayments, getBuyerPayments };
