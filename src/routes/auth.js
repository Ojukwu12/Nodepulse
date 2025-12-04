/**
 * Auth routes: register, login, wallet verify
 */

const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/register', asyncHandler(authController.register));
router.post('/login', asyncHandler(authController.login));
router.post('/wallet/verify', asyncHandler(authController.verifyWallet));

module.exports = router;
