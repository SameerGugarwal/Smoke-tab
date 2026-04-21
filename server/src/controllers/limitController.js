const Limit = require('../models/Limit');

const getLimits = async (req, res) => {
  try {
    const limits = await Limit.find({ userId: req.user._id, isActive: true });
    res.json({ limits });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const upsertLimit = async (req, res) => {
  try {
    const { limitType, limitValue, itemCategory = 'cigarette' } = req.body;
    if (!limitType || limitValue == null) {
      return res.status(400).json({ error: 'limitType and limitValue required' });
    }

    // Deactivate existing limit of same type
    await Limit.updateMany(
      { userId: req.user._id, limitType, itemCategory },
      { isActive: false }
    );

    const limit = await Limit.create({
      userId: req.user._id,
      limitType,
      limitValue,
      itemCategory,
      isActive: true,
    });

    res.status(201).json({ limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteLimit = async (req, res) => {
  try {
    await Limit.findOneAndUpdate(
      { _id: req.params.limitId, userId: req.user._id },
      { isActive: false }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getLimits, upsertLimit, deleteLimit };
