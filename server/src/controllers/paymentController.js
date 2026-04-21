const Payment = require('../models/Payment');
const Tab = require('../models/Tab');

// Record a payment (buyer initiates)
const recordPayment = async (req, res) => {
  try {
    const { tabId, amount, method = 'upi', upiRef } = req.body;
    if (!tabId || !amount) return res.status(400).json({ error: 'tabId and amount required' });

    const tab = await Tab.findById(tabId);
    if (!tab) return res.status(404).json({ error: 'Tab not found' });

    const payment = await Payment.create({ tabId, amount, method, upiRef, status: 'pending' });
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

module.exports = { recordPayment, confirmPayment, getTabPayments };
