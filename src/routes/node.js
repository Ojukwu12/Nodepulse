/**
 * Node routes: register node, get list, metrics ingest
 */

const express = require('express');
const { authMiddleware, requireAuth } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const nodeController = require('../controllers/nodeController');

const router = express.Router();
router.use(authMiddleware);

router.post('/', requireAuth, asyncHandler(nodeController.createNode));
router.get('/', requireAuth, asyncHandler(nodeController.listNodes));
router.get('/:nodeId', requireAuth, asyncHandler(nodeController.getNode));

// Sidecar metrics ingestion - allow API key or wallet auth (handled in controller)
router.post('/:nodeId/metrics', asyncHandler(nodeController.ingestMetrics));

module.exports = router;
