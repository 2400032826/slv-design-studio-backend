const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, unique: true },
  description: String,
  shortDescription: String,
  category: {
    type: String,
    enum: ['embroidery', 'printing', 'stitching', 'jewellery', 'gifts', 'other'],
    required: true,
  },
  image: String,
  priceRange: { min: Number, max: Number, unit: { type: String, default: 'per piece' } },
  deliveryTime: String,
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 },
  features: [String],
  faqs: [{ question: String, answer: String }],
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);
