const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name: String,
  image: String,
  price: Number,
  quantity: { type: Number, default: 1 },
  size: String,
  color: String,
  customization: {
    fabricType: String,
    threadColor: String,
    embroideryType: String,
    printingType: String,
    neckDesign: String,
    sleeveDesign: String,
    backDesign: String,
    blouseModel: String,
    specialInstructions: String,
    referenceImages: [String],
    logoUrl: String,
    pdfUrl: String,
    designFileUrl: String,
    measurementsUrl: String,
    samplePhotoUrl: String,
  },
  measurements: {
    chest: Number, waist: Number, hips: Number,
    shoulder: Number, armLength: Number, blouseLength: Number, neckDepth: Number,
    notes: String,
  },
  isCustomOrder: { type: Boolean, default: false },
  expressDelivery: { type: Boolean, default: false },
  giftWrap: { type: Boolean, default: false },
  giftMessage: String,
});

const trackingSchema = new mongoose.Schema({
  status: String,
  message: String,
  timestamp: { type: Date, default: Date.now },
  updatedBy: String,
});

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  shippingAddress: {
    fullName: String, phone: String, address: String,
    city: String, state: String, pincode: String,
  },
  paymentMethod: {
    type: String,
    default: 'booking',
  },
  paymentStatus: { type: String, default: 'booking' },
  payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  status: {
    type: String,
    enum: ['Pending Confirmation', 'order_received', 'accepted', 'in_production', 'embroidery_started', 'printing_started', 'stitching_started', 'quality_check', 'packed', 'shipped', 'delivered', 'cancelled', 'rejected'],
    default: 'Pending Confirmation',
  },
  trackingHistory: [trackingSchema],
  coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
  couponDiscount: { type: Number, default: 0 },
  itemsPrice: { type: Number, default: 0 },
  shippingCharge: { type: Number, default: 0 },
  expressCharge: { type: Number, default: 0 },
  giftWrapCharge: { type: Number, default: 0 },
  taxPrice: { type: Number, default: 0 },
  totalPrice: { type: Number, required: true },
  estimatedDelivery: String,
  deliveredAt: Date,
  adminNotes: String,
  customerNotes: String,
  rejectionReason: String,
  invoiceUrl: String,
}, { timestamps: true });

orderSchema.pre('save', function (next) {
  if (!this.orderNumber) {
    this.orderNumber = 'SLV' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 1000);
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
