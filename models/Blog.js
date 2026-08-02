const mongoose = require('mongoose');
const slugify = require('slugify');

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, unique: true },
  content: { type: String, required: true },
  excerpt: String,
  coverImage: String,
  author: { type: String, default: 'SLV Design Studio' },
  category: String,
  tags: [String],
  isPublished: { type: Boolean, default: false },
  publishedAt: Date,
  views: { type: Number, default: 0 },
  seo: { metaTitle: String, metaDescription: String, keywords: [String] },
  readTime: Number,
}, { timestamps: true });

blogSchema.pre('save', function (next) {
  if (this.isModified('title')) {
    this.slug = slugify(this.title, { lower: true, strict: true }) + '-' + Date.now();
  }
  if (this.content) {
    const words = this.content.split(' ').length;
    this.readTime = Math.ceil(words / 200);
  }
  next();
});

module.exports = mongoose.model('Blog', blogSchema);
