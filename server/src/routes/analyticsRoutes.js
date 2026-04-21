const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/analyticsController');

router.get('/exposure', auth, ctrl.getExposure);
router.get('/top-debtors', auth, ctrl.getTopDebtors);
router.get('/trends', auth, ctrl.getShopTrends);

module.exports = router;
