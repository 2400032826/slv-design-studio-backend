const mongoose = require('mongoose');
const slugify = require('slugify');

const productSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Product name is required'], trim: true },
  slug: { type: String, unique: true },
  description: { type: String, required: true },
  shortDescription: String,
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  subcategory: String,
  sku: { type: String, unique: true, sparse: true },
  images: [{ url: String, publicId: String, alt: String }],
  video: { url: String, publicId: String },
  price: { type: Number, required: true, min: 0 },
  mrp: { type: Number, min: 0 },
  offerPrice: { type: Number, min: 0 },
  discountPercent: { type: Number, default: 0 },
  colors: [{ name: String, hex: String, image: String }],
  sizes: [{ label: String, measurements: String, available: { type: Boolean, default: true } }],
  material: String,
  fabricType: String,
  embroideryType: String,
  printingType: String,
  careInstructions: String,
  stock: { type: Number, default: 0, min: 0 },
  isInStock: { type: Boolean, default: true },
  isCustomizable: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  isNewArrival: { type: Boolean, default: false },
  isBestseller: { type: Boolean, default: false },
  deliveryTime: { type: String, default: '5-7 business days' },
  deliveryCharge: { type: Number, default: 0 },
  expressDeliveryAvailable: { type: Boolean, default: false },
  expressDeliveryCharge: { type: Number, default: 0 },
  tags: [String],
  rating: { type: Number, default: 0, min: 0, max: 5 },
  numReviews: { type: Number, default: 0 },
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
  relatedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  seo: { metaTitle: String, metaDescription: String, keywords: [String] },
  views: { type: Number, default: 0 },
  soldCount: { type: Number, default: 0 },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

productSchema.virtual('discountAmount').get(function () {
  if (this.mrp && this.offerPrice) return this.mrp - this.offerPrice;
  return 0;
});

productSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true }) + '-' + Date.now();
  }
  if (this.mrp && this.offerPrice) {
    this.discountPercent = Math.round(((this.mrp - this.offerPrice) / this.mrp) * 100);
  }
  next();
});

productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ isFeatured: 1 });

module.exports = mongoose.model('Product', productSchema);
