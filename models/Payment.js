const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  method: { type: String, enum: ['cod', 'upi', 'razorpay', 'phonepay', 'googlepay'], required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  upiTransactionId: String,
  refundId: String,
  refundAmount: Number,
  refundReason: String,
  failureReason: String,
  paidAt: Date,
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
