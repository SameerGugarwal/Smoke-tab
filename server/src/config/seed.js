const User = require('../models/User');
const Shop = require('../models/Shop');
const Tab = require('../models/Tab');
const InventoryItem = require('../models/InventoryItem');

const DEFAULT_ITEMS = [
  { name: 'Classic Milds', icon: '🚬', price: 1500, category: 'cigarette', sortOrder: 0 },
  { name: 'Marlboro', icon: '🚬', price: 2000, category: 'cigarette', sortOrder: 1 },
  { name: 'Gold Flake', icon: '🚬', price: 1200, category: 'cigarette', sortOrder: 2 },
  { name: 'Chai', icon: '☕', price: 1000, category: 'chai', sortOrder: 3 },
  { name: 'Gum', icon: '🍬', price: 500, category: 'gum', sortOrder: 4 },
  { name: 'Bidi', icon: '🚬', price: 500, category: 'cigarette', sortOrder: 5 },
];

const seedDummyData = async () => {
  try {
    // Find vendor sam
    let sam = await User.findOne({ name: 'sam', role: 'vendor' });
    if (!sam) {
      sam = await User.create({ phone: '9000000001', name: 'sam', role: 'vendor' });
      console.log('Seed: created vendor sam');
    }

    // Ensure sam has a shop
    let shop = await Shop.findOne({ vendorId: sam._id });
    if (!shop) {
      shop = await Shop.create({ vendorId: sam._id, name: 'limbra' });
      const items = DEFAULT_ITEMS.map((item) => ({ ...item, shopId: shop._id }));
      await InventoryItem.insertMany(items);
      console.log("Seed: created shop 'limbra' for sam");
    }

    // Create buyer lincoln
    let lincoln = await User.findOne({ name: 'lincoln', role: 'buyer' });
    if (!lincoln) {
      lincoln = await User.create({ phone: '9000000002', name: 'lincoln', role: 'buyer' });
      console.log('Seed: created buyer lincoln');
    }

    // Link lincoln to sam's shop
    const existing = await Tab.findOne({ shopId: shop._id, buyerId: lincoln._id });
    if (!existing) {
      await Tab.create({ shopId: shop._id, buyerId: lincoln._id, balanceDue: 0 });
      console.log("Seed: linked lincoln to sam's shop");
    }
  } catch (err) {
    console.error('Seed error:', err.message);
  }
};

module.exports = seedDummyData;
