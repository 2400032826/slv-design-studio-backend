const Notification = require('../models/Notification');

exports.getMyNotifications = async (req, res) => {
  const notifications = await Notification.find({
    $or: [{ user: req.user._id }, { isGlobal: true }],
  })
    .sort('-createdAt')
    .limit(50);

  const unreadCount = await Notification.countDocuments({
    $or: [{ user: req.user._id }, { isGlobal: true }],
    isRead: false,
  });

  res.status(200).json({ success: true, notifications, unreadCount });
};

exports.markAsRead = async (req, res) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true }
  );
  res.status(200).json({ success: true });
};

exports.markAllRead = async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id, isRead: false },
    { isRead: true }
  );
  res.status(200).json({ success: true });
};

exports.createGlobalNotification = async (req, res) => {
  const notification = await Notification.create({ ...req.body, isGlobal: true });
  res.status(201).json({ success: true, notification });
};
