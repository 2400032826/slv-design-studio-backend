const express = require('express');
const router = express.Router();
const {
  sendOTP, verifyOTP, checkEmail, adminLogin, getMe, updateProfile,
  addAddress, deleteAddress, saveMeasurement, toggleWishlist,
  forgotPassword, resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter, otpLimiter } = require('../middleware/rateLimiter');

// Email & OTP Authentication Routes
router.post('/check-email', checkEmail);
router.post('/send-otp', otpLimiter, sendOTP);
router.post('/otp/send', otpLimiter, sendOTP);
router.post('/verify-otp', authLimiter, verifyOTP);
router.post('/otp/verify', authLimiter, verifyOTP);

// Admin & Password Reset Routes
router.post('/admin-login', authLimiter, adminLogin);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password/:token', authLimiter, resetPassword);

// Protected User Routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/address', protect, addAddress);
router.delete('/address/:id', protect, deleteAddress);
router.post('/measurements', protect, saveMeasurement);
router.post('/wishlist/:productId', protect, toggleWishlist);

module.exports = router;
