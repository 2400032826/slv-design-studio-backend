const express = require('express');
const router = express.Router();
const { createRazorpayOrder, verifyRazorpayPayment, confirmCOD } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.post('/razorpay/create', protect, createRazorpayOrder);
router.post('/razorpay/verify', protect, verifyRazorpayPayment);
router.post('/cod', protect, confirmCOD);

module.exports = router;
