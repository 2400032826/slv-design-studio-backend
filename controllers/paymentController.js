const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Payment = require('../models/Payment');

const getRazorpayInstance = () => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret',
  });
};

// @desc Create Razorpay order
// @route POST /api/payments/razorpay/create
exports.createRazorpayOrder = async (req, res) => {
  const { orderId } = req.body;
  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  if (order.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  const razorpayOrder = await getRazorpayInstance().orders.create({
    amount: Math.round(order.totalPrice * 100),
    currency: 'INR',
    receipt: order.orderNumber,
    notes: { orderId: order._id.toString(), customerName: req.user.name },
  });

  const payment = await Payment.create({
    order: order._id,
    user: req.user._id,
    method: 'razorpay',
    amount: order.totalPrice,
    razorpayOrderId: razorpayOrder.id,
  });

  order.payment = payment._id;
  await order.save();

  res.status(200).json({
    success: true,
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
  });
};

// @desc Verify Razorpay payment
// @route POST /api/payments/razorpay/verify
exports.verifyRazorpayPayment = async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body;

  const body = razorpayOrderId + '|' + razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (expectedSignature !== razorpaySignature) {
    return res.status(400).json({ success: false, message: 'Payment verification failed' });
  }

  const payment = await Payment.findOneAndUpdate(
    { razorpayOrderId },
    { razorpayPaymentId, razorpaySignature, status: 'completed', paidAt: new Date() },
    { new: true }
  );

  await Order.findByIdAndUpdate(orderId, { paymentStatus: 'paid' });

  res.status(200).json({ success: true, message: 'Payment verified successfully', payment });
};

// @desc Confirm COD payment
// @route POST /api/payments/cod
exports.confirmCOD = async (req, res) => {
  const { orderId } = req.body;
  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  const payment = await Payment.create({
    order: orderId,
    user: req.user._id,
    method: 'cod',
    amount: order.totalPrice,
    status: 'pending',
  });

  order.payment = payment._id;
  await order.save();

  res.status(200).json({ success: true, message: 'COD order confirmed', payment });
};
