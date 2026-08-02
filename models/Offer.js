const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  type: { type: String, enum: ['banner', 'flash_sale', 'festival', 'referral', 'product_discount'], required: true },
  discountPercent: Number,
  discountAmount: Number,
  bannerImage: String,
  bannerLink: String,
  applicableProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  isActive: { type: Boolean, default: true },
  isHomepageSlider: { type: Boolean, default: false },
  startDate: Date,
  endDate: Date,
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Offer', offerSchema);
