const Tab = require('../models/Tab');
const Shop = require('../models/Shop');
const Transaction = require('../models/Transaction');

const getExposure = async (req, res) => {
  try {
    const shop = await Shop.findOne({ vendorId: req.user._id });
    if (!shop) return res.status(404).json({ error: 'No shop found' });

    const result = await Tab.aggregate([
      { $match: { shopId: shop._id } },
      { $group: { _id: null, totalExposure: { $sum: '$balanceDue' }, customerCount: { $sum: 1 } } },
    ]);

    res.json({
      totalExposure: result[0]?.totalExposure || 0,
      customerCount: result[0]?.customerCount || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getTopDebtors = async (req, res) => {
  try {
    const shop = await Shop.findOne({ vendorId: req.user._id });
    if (!shop) return res.status(404).json({ error: 'No shop found' });

    const tabs = await Tab.find({ shopId: shop._id, balanceDue: { $gt: 0 } })
      .populate('buyerId', 'name phone')
      .sort({ balanceDue: -1 })
      .limit(10);

    res.json({ debtors: tabs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getShopTrends = async (req, res) => {
  try {
    const shop = await Shop.findOne({ vendorId: req.user._id });
    if (!shop) return res.status(404).json({ error: 'No shop found' });

    const tabs = await Tab.find({ shopId: shop._id }).select('_id');
    const tabIds = tabs.map((t) => t._id);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const daily = await Transaction.aggregate([
      { $match: { tabId: { $in: tabIds }, createdAt: { $gte: startOfMonth } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$amount' },
          items: { $sum: '$quantity' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ daily });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getExposure, getTopDebtors, getShopTrends };
