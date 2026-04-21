const Shop = require('../models/Shop');
const InventoryItem = require('../models/InventoryItem');

const DEFAULT_ITEMS = [
  // ── Marlboro (Godfrey Phillips / Philip Morris) ──
  { name: 'Marlboro Red', icon: '🚬', price: 2400, category: 'cigarette', sortOrder: 0 },
  { name: 'Marlboro Gold', icon: '🚬', price: 2400, category: 'cigarette', sortOrder: 1 },
  { name: 'Marlboro Advance', icon: '🚬', price: 2400, category: 'cigarette', sortOrder: 2 },
  { name: 'Marlboro Fuse Beyond', icon: '🚬', price: 2400, category: 'cigarette', sortOrder: 3 },
  { name: 'Marlboro Fine Touch', icon: '🚬', price: 1950, category: 'cigarette', sortOrder: 4 },
  { name: 'Marlboro Double Burst', icon: '🚬', price: 2400, category: 'cigarette', sortOrder: 5 },
  { name: 'Marlboro Purple Burst', icon: '🚬', price: 2400, category: 'cigarette', sortOrder: 6 },
  { name: 'Marlboro Compact', icon: '🚬', price: 2400, category: 'cigarette', sortOrder: 7 },
  { name: 'Marlboro Filter Black', icon: '🚬', price: 2100, category: 'cigarette', sortOrder: 8 },

  // ── Gold Flake (ITC) ──
  { name: 'Gold Flake Kings Blue', icon: '🚬', price: 1700, category: 'cigarette', sortOrder: 9 },
  { name: 'Gold Flake Kings Twin Pod', icon: '🚬', price: 1700, category: 'cigarette', sortOrder: 10 },
  { name: 'Gold Flake Neo Smart', icon: '🚬', price: 950, category: 'cigarette', sortOrder: 11 },
  { name: 'Gold Flake Indie Mint', icon: '🚬', price: 1000, category: 'cigarette', sortOrder: 12 },
  { name: 'Gold Flake Blue Mint Switch', icon: '🚬', price: 950, category: 'cigarette', sortOrder: 13 },

  // ── Four Square (Godfrey Phillips) ──
  { name: 'Four Square Kings', icon: '🚬', price: 900, category: 'cigarette', sortOrder: 14 },
  { name: 'Four Square Special', icon: '🚬', price: 900, category: 'cigarette', sortOrder: 15 },
  { name: 'Four Square Crush Clove', icon: '🚬', price: 900, category: 'cigarette', sortOrder: 16 },
  { name: 'Four Square Crush Tropical', icon: '🚬', price: 900, category: 'cigarette', sortOrder: 17 },
  { name: 'Four Square Crush Saunf', icon: '🚬', price: 900, category: 'cigarette', sortOrder: 18 },

  // ── Classic / Wills Classic (ITC) ──
  { name: 'Classic Regular', icon: '🚬', price: 1700, category: 'cigarette', sortOrder: 19 },
  { name: 'Classic Milds', icon: '🚬', price: 1700, category: 'cigarette', sortOrder: 20 },
  { name: 'Classic Ultra Milds', icon: '🚬', price: 1700, category: 'cigarette', sortOrder: 21 },
  { name: 'Classic Ice Burst', icon: '🚬', price: 1700, category: 'cigarette', sortOrder: 22 },
  { name: 'Classic Verve', icon: '🚬', price: 1700, category: 'cigarette', sortOrder: 23 },
  { name: 'Classic Connect', icon: '🚬', price: 1500, category: 'cigarette', sortOrder: 24 },
  { name: 'Classic Red', icon: '🚬', price: 1700, category: 'cigarette', sortOrder: 25 },
  { name: 'Classic Shift', icon: '🚬', price: 1700, category: 'cigarette', sortOrder: 26 },
  { name: 'Classic Double Burst', icon: '🚬', price: 1700, category: 'cigarette', sortOrder: 27 },

  // ── Dunhill (BAT) ──
  { name: 'Dunhill International', icon: '🚬', price: 1900, category: 'cigarette', sortOrder: 28 },
  { name: 'Dunhill Switch', icon: '🚬', price: 1950, category: 'cigarette', sortOrder: 29 },
  { name: 'Dunhill Switch 8mg', icon: '🚬', price: 2625, category: 'cigarette', sortOrder: 30 },

  // ── Others ──
  { name: 'Bidi', icon: '🚬', price: 500, category: 'cigarette', sortOrder: 31 },
  { name: 'Chai', icon: '☕', price: 1000, category: 'chai', sortOrder: 32 },
  { name: 'Gum', icon: '🍬', price: 500, category: 'gum', sortOrder: 33 },
];

// Create shop (vendor onboarding)
const createShop = async (req, res) => {
  try {
    const { name, upiId } = req.body;
    if (!name) return res.status(400).json({ error: 'Shop name is required' });

    const existing = await Shop.findOne({ vendorId: req.user._id });
    if (existing) return res.status(409).json({ error: 'Shop already exists', shop: existing });

    const shop = await Shop.create({ vendorId: req.user._id, name, upiId });

    // Seed default inventory
    const items = DEFAULT_ITEMS.map((item) => ({ ...item, shopId: shop._id }));
    await InventoryItem.insertMany(items);

    res.status(201).json({ shop });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get vendor's shop
const getMyShop = async (req, res) => {
  try {
    const shop = await Shop.findOne({ vendorId: req.user._id });
    if (!shop) return res.status(404).json({ error: 'No shop found' });
    res.json({ shop });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update shop
const updateShop = async (req, res) => {
  try {
    const shop = await Shop.findOneAndUpdate(
      { vendorId: req.user._id },
      { $set: req.body },
      { new: true }
    );
    if (!shop) return res.status(404).json({ error: 'Shop not found' });
    res.json({ shop });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get shop by QR token (for linking)
const getShopByToken = async (req, res) => {
  try {
    const shop = await Shop.findOne({ qrToken: req.params.token }).populate('vendorId', 'name phone');
    if (!shop) return res.status(404).json({ error: 'Invalid QR code' });
    res.json({ shop });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Inventory CRUD
const getInventory = async (req, res) => {
  try {
    const shop = await Shop.findOne({ vendorId: req.user._id });
    if (!shop) return res.status(404).json({ error: 'Shop not found' });

    const items = await InventoryItem.find({ shopId: shop._id, isActive: true }).sort('sortOrder');
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const addInventoryItem = async (req, res) => {
  try {
    const shop = await Shop.findOne({ vendorId: req.user._id });
    if (!shop) return res.status(404).json({ error: 'Shop not found' });

    const item = await InventoryItem.create({ ...req.body, shopId: shop._id });
    res.status(201).json({ item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateInventoryItem = async (req, res) => {
  try {
    const shop = await Shop.findOne({ vendorId: req.user._id });
    if (!shop) return res.status(404).json({ error: 'Shop not found' });

    const item = await InventoryItem.findOneAndUpdate(
      { _id: req.params.itemId, shopId: shop._id },
      { $set: req.body },
      { new: true }
    );
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json({ item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteInventoryItem = async (req, res) => {
  try {
    const shop = await Shop.findOne({ vendorId: req.user._id });
    if (!shop) return res.status(404).json({ error: 'Shop not found' });

    await InventoryItem.findOneAndUpdate(
      { _id: req.params.itemId, shopId: shop._id },
      { isActive: false }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Sync catalog: add any missing default items to existing shop
const syncCatalog = async (req, res) => {
  try {
    const shop = await Shop.findOne({ vendorId: req.user._id });
    if (!shop) return res.status(404).json({ error: 'Shop not found' });

    const existing = await InventoryItem.find({ shopId: shop._id });
    const existingNames = new Set(existing.map((i) => i.name.toLowerCase()));

    const newItems = DEFAULT_ITEMS
      .filter((item) => !existingNames.has(item.name.toLowerCase()))
      .map((item) => ({ ...item, shopId: shop._id }));

    if (newItems.length === 0) {
      return res.json({ message: 'Catalog already up to date', added: 0 });
    }

    await InventoryItem.insertMany(newItems);
    res.json({ message: `Added ${newItems.length} new items`, added: newItems.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createShop,
  getMyShop,
  updateShop,
  getShopByToken,
  getInventory,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  syncCatalog,
};
