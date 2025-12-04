/**
 * Payout routes
 */

const express = require('express');
const { authMiddleware, requireAuth } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const payoutController = require('../controllers/payoutController');

const router = express.Router();
router.use(authMiddleware);

router.get('/', requireAuth, asyncHandler(payoutController.listPayouts));
router.get('/:payoutId', requireAuth, asyncHandler(payoutController.getPayout));

module.exports = router;
