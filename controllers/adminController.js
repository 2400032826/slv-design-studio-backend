const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Review = require('../models/Review');
const ContactMessage = require('../models/ContactMessage');

// @desc Admin Dashboard Stats
// @route GET /api/admin/dashboard
exports.getDashboard = async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    totalUsers,
    totalProducts,
    totalOrders,
    pendingOrders,
    completedOrders,
    cancelledOrders,
    totalRevenue,
    monthRevenue,
    todayOrders,
    newMessages,
    lowStockProducts,
    recentOrders,
  ] = await Promise.all([
    User.countDocuments(),
    Product.countDocuments({ isActive: true }),
    Order.countDocuments(),
    Order.countDocuments({ status: { $in: ['Pending Confirmation', 'order_received', 'accepted', 'in_production', 'embroidery_started', 'printing_started', 'stitching_started', 'quality_check', 'packed', 'shipped'] } }),
    Order.countDocuments({ status: 'delivered' }),
    Order.countDocuments({ status: 'cancelled' }),
    Order.aggregate([{ $group: { _id: null, total: { $sum: '$totalPrice' } } }]),
    Order.aggregate([{ $match: { createdAt: { $gte: thisMonth } } }, { $group: { _id: null, total: { $sum: '$totalPrice' } } }]),
    Order.countDocuments({ createdAt: { $gte: today } }),
    ContactMessage.countDocuments({ status: 'new' }),
    Product.find({ stock: { $lt: 5, $gte: 0 }, isActive: true }).select('name stock images').limit(10),
    Order.find().populate('user', 'name email phone').sort('-createdAt').limit(10)
      .select('orderNumber status totalPrice user createdAt paymentMethod'),
  ]);

  // Monthly revenue/order chart data (last 6 months)
  const revenueChart = await Order.aggregate([
    { $match: { createdAt: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) } } },
    { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, revenue: { $sum: '$totalPrice' }, orders: { $sum: 1 } } },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  res.status(200).json({
    success: true,
    stats: {
      totalUsers, totalProducts, totalOrders, pendingOrders, completedOrders, cancelledOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      monthRevenue: monthRevenue[0]?.total || 0,
      todayOrders, newMessages,
    },
    lowStockProducts,
    recentOrders,
    revenueChart,
  });
};

// @desc Admin: Get all customers
// @route GET /api/admin/customers
exports.getCustomers = async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  const query = {};
  if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];

  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .sort('-createdAt')
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit))
    .select('name email phone isBlocked isEmailVerified totalOrders totalSpent createdAt avatar');

  res.status(200).json({ success: true, total, users });
};

// @desc Admin: Get single customer
// @route GET /api/admin/customers/:id
exports.getCustomer = async (req, res) => {
  const user = await User.findById(req.params.id).select('-otp -otpExpiry -resetPasswordToken');
  if (!user) return res.status(404).json({ success: false, message: 'Customer not found' });
  const orders = await Order.find({ user: req.params.id }).sort('-createdAt').limit(20);
  res.status(200).json({ success: true, user, orders });
};

// @desc Admin: Block/unblock customer
// @route PATCH /api/admin/customers/:id/block
exports.toggleBlockCustomer = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  user.isBlocked = !user.isBlocked;
  await user.save();
  res.status(200).json({ success: true, isBlocked: user.isBlocked });
};
