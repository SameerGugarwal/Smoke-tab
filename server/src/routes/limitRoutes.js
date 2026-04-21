const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/limitController');

router.get('/', auth, ctrl.getLimits);
router.post('/', auth, ctrl.upsertLimit);
router.delete('/:limitId', auth, ctrl.deleteLimit);

module.exports = router;
