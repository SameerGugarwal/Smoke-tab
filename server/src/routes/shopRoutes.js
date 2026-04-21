const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/shopController');

router.post('/', auth, ctrl.createShop);
router.get('/mine', auth, ctrl.getMyShop);
router.put('/mine', auth, ctrl.updateShop);
router.get('/by-token/:token', ctrl.getShopByToken);

router.get('/mine/inventory', auth, ctrl.getInventory);
router.post('/mine/inventory', auth, ctrl.addInventoryItem);
router.put('/mine/inventory/:itemId', auth, ctrl.updateInventoryItem);
router.delete('/mine/inventory/:itemId', auth, ctrl.deleteInventoryItem);
router.post('/mine/sync-catalog', auth, ctrl.syncCatalog);

module.exports = router;
