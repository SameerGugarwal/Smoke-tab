const Tab = require('../models/Tab');
const Shop = require('../models/Shop');
const Transaction = require('../models/Transaction');
const Limit = require('../models/Limit');
const InventoryItem = require('../models/InventoryItem');

// Link buyer to shop via QR token → creates a tab
const linkTab = async (req, res) => {
  try {
    const { qrToken } = req.body;
    const shop = await Shop.findOne({ qrToken });
    if (!shop) return res.status(404).json({ error: 'Invalid QR code' });

    let tab = await Tab.findOne({ shopId: shop._id, buyerId: req.user._id });
    if (tab) return res.json({ tab, message: 'Already linked' });

    tab = await Tab.create({ shopId: shop._id, buyerId: req.user._id });
    res.status(201).json({ tab });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all tabs for a buyer
const getBuyerTabs = async (req, res) => {
  try {
    const tabs = await Tab.find({ buyerId: req.user._id })
      .populate({ path: 'shopId', select: 'name upiId qrToken' })
      .sort({ updatedAt: -1 });
    res.json({ tabs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all tabs for a vendor (their shop's customers)
const getVendorTabs = async (req, res) => {
  try {
    const shop = await Shop.findOne({ vendorId: req.user._id });
    if (!shop) return res.status(404).json({ error: 'No shop found' });

    const tabs = await Tab.find({ shopId: shop._id })
      .populate('buyerId', 'name phone avatarUrl')
      .sort({ balanceDue: -1 });
    res.json({ tabs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get single tab with transactions
const getTabDetail = async (req, res) => {
  try {
    const tab = await Tab.findById(req.params.tabId)
      .populate('shopId', 'name upiId')
      .populate('buyerId', 'name phone');
    if (!tab) return res.status(404).json({ error: 'Tab not found' });

    const transactions = await Transaction.find({ tabId: tab._id }).sort({ createdAt: -1 }).limit(50);
    res.json({ tab, transactions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add item to tab (vendor action)
const addTransaction = async (req, res) => {
  try {
    const { tabId } = req.params;
    const { itemId, itemName, itemIcon, category, quantity = 1, amount, limitOverride = false } = req.body;

    const tab = await Tab.findById(tabId).populate('shopId');
    if (!tab) return res.status(404).json({ error: 'Tab not found' });

    // Verify vendor owns this tab's shop
    if (String(tab.shopId.vendorId) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Not your shop' });
    }

    // Check buyer's active limits
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeLimits = await Limit.find({ userId: tab.buyerId, isActive: true });

    for (const limit of activeLimits) {
      const catFilter = limit.itemCategory === 'all' ? {} : { category: limit.itemCategory };

      if (limit.limitType === 'daily_count' && category === limit.itemCategory) {
        const todayCount = await Transaction.aggregate([
          {
            $match: {
              tabId: tab._id,
              category: limit.itemCategory,
              createdAt: { $gte: today },
            },
          },
          { $group: { _id: null, total: { $sum: '$quantity' } } },
        ]);
        const count = todayCount[0]?.total || 0;

        if (count + quantity > limit.limitValue && !limitOverride) {
          return res.status(422).json({
            limitExceeded: true,
            limitType: 'daily_count',
            limitValue: limit.limitValue,
            currentCount: count,
            message: `Buyer's daily limit is ${limit.limitValue} cigarettes. Currently at ${count}.`,
          });
        }
      }

      if (limit.limitType === 'daily_amount') {
        const todaySpend = await Transaction.aggregate([
          { $match: { tabId: tab._id, createdAt: { $gte: today } } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        const spent = todaySpend[0]?.total || 0;

        if (spent + amount > limit.limitValue && !limitOverride) {
          return res.status(422).json({
            limitExceeded: true,
            limitType: 'daily_amount',
            limitValue: limit.limitValue,
            currentSpend: spent,
            message: `Buyer's daily spend limit is ₹${limit.limitValue / 100}. Currently at ₹${spent / 100}.`,
          });
        }
      }
    }

    const tx = await Transaction.create({
      tabId,
      itemId,
      itemName,
      itemIcon: itemIcon || '🚬',
      category: category || 'other',
      quantity,
      amount,
      limitOverridden: limitOverride,
    });

    // Update tab balance
    tab.balanceDue += amount;
    await tab.save();

    // Emit socket event
    req.io?.to(`tab:${tabId}`).emit('tab:item-added', { tx, tab });
    req.io?.to(`user:${tab.buyerId}`).emit('tab:item-added', { tx, tab });

    res.status(201).json({ tx, tab });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete transaction (vendor)
const deleteTransaction = async (req, res) => {
  try {
    const { tabId, txId } = req.params;
    const tab = await Tab.findById(tabId).populate('shopId');
    if (!tab) return res.status(404).json({ error: 'Tab not found' });

    if (String(tab.shopId.vendorId) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Not your shop' });
    }

    const tx = await Transaction.findOneAndDelete({ _id: txId, tabId });
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });

    tab.balanceDue = Math.max(0, tab.balanceDue - tx.amount);
    await tab.save();

    req.io?.to(`tab:${tabId}`).emit('tab:item-removed', { txId, tab });
    req.io?.to(`user:${tab.buyerId}`).emit('tab:item-removed', { txId, tab });

    res.json({ success: true, tab });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Consumption stats for buyer
const getConsumption = async (req, res) => {
  try {
    const { tabId } = req.params;
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(now);
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    const startOfMonth = new Date(now);
    startOfMonth.setDate(1);

    const aggregate = await Transaction.aggregate([
      { $match: { tabId: require('mongoose').Types.ObjectId.createFromHexString(tabId) } },
      {
        $facet: {
          daily: [
            { $match: { createdAt: { $gte: startOfDay } } },
            { $group: { _id: null, count: { $sum: '$quantity' }, amount: { $sum: '$amount' } } },
          ],
          weekly: [
            { $match: { createdAt: { $gte: startOfWeek } } },
            {
              $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                count: { $sum: '$quantity' },
                amount: { $sum: '$amount' },
              },
            },
            { $sort: { _id: 1 } },
          ],
          monthly: [
            { $match: { createdAt: { $gte: startOfMonth } } },
            { $group: { _id: null, count: { $sum: '$quantity' }, amount: { $sum: '$amount' } } },
          ],
        },
      },
    ]);

    res.json(aggregate[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  linkTab,
  getBuyerTabs,
  getVendorTabs,
  getTabDetail,
  addTransaction,
  deleteTransaction,
  getConsumption,
};
