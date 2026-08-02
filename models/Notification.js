const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: {
    type: String,
    enum: ['order_update', 'offer', 'review', 'system', 'payment', 'admin_alert'],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  icon: String,
  link: String,
  isRead: { type: Boolean, default: false },
  isGlobal: { type: Boolean, default: false },
  data: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
