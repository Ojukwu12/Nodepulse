/**
 * Stats routes for node metrics and aggregates
 */

const express = require('express');
const { authMiddleware, requireAuth } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const statsController = require('../controllers/statsController');

const router = express.Router();
router.use(authMiddleware);

router.get('/nodes/:nodeId', requireAuth, asyncHandler(statsController.getNodeMetrics));
router.get('/dashboard/summary', requireAuth, asyncHandler(statsController.dashboardSummary));

module.exports = router;
