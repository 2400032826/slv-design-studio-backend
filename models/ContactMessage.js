const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  subject: { type: String, default: 'General Inquiry' },
  message: { type: String, required: true },
  status: { type: String, enum: ['new', 'read', 'replied', 'closed'], default: 'new' },
  adminNotes: String,
  repliedAt: Date,
  ipAddress: String,
}, { timestamps: true });

module.exports = mongoose.model('ContactMessage', contactMessageSchema);
