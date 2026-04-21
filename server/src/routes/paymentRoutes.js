const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/paymentController');

router.post('/', auth, ctrl.recordPayment);
router.put('/:paymentId/confirm', auth, ctrl.confirmPayment);
router.get('/tab/:tabId', auth, ctrl.getTabPayments);

module.exports = router;
