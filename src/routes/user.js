/**
 * User routes
 */

const express = require('express');
const { authMiddleware, requireAuth } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const userController = require('../controllers/userController');

const router = express.Router();

router.use(authMiddleware);
router.get('/me', requireAuth, asyncHandler(userController.me));
router.get('/', requireAuth, asyncHandler(userController.list));

module.exports = router;
