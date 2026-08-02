const mongoose = require('mongoose');

const galleryItemSchema = new mongoose.Schema({
  title: String,
  description: String,
  url: { type: String, required: true },
  publicId: String,
  type: { type: String, enum: ['image', 'video'], required: true },
  category: { type: String, enum: ['embroidery', 'printing', 'stitching', 'jewellery', 'wedding', 'bridal', 'other'], default: 'other' },
  tags: [String],
  isHomepageSlider: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Gallery', galleryItemSchema);
