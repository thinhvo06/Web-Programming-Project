const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Public auth routes
router.post('/register', authController.register);
router.get('/activate/:token', authController.activate);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-reset-otp', authController.verifyResetOtp);
router.post('/reset-password', authController.resetPassword);

// Protected auth routes
router.post('/resend-activation', authenticate, authController.resendActivation);

module.exports = router;
