const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/tabController');

router.post('/link', auth, ctrl.linkTab);
router.get('/buyer', auth, ctrl.getBuyerTabs);
router.get('/vendor', auth, ctrl.getVendorTabs);
router.get('/:tabId', auth, ctrl.getTabDetail);
router.post('/:tabId/transactions', auth, ctrl.addTransaction);
router.delete('/:tabId/transactions/:txId', auth, ctrl.deleteTransaction);
router.get('/:tabId/consumption', auth, ctrl.getConsumption);

module.exports = router;
