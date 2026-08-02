const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Coupon = require('../models/Coupon');
const Notification = require('../models/Notification');
const { sendOrderConfirmationEmail, sendOrderStatusEmail } = require('../utils/sendEmail');

// @desc Place new booking order (No payment required)
// @route POST /api/orders
exports.placeOrder = async (req, res) => {
  const {
    items, shippingAddress, couponCode,
    customerNotes, giftWrap, giftMessage,
  } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'No items in booking order' });
  }

  let itemsPrice = 0;
  let shippingCharge = 0;
  let expressCharge = 0;
  let giftWrapCharge = giftWrap ? 50 : 0;
  let couponDiscount = 0;

  const processedItems = [];

  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product) return res.status(404).json({ success: false, message: `Product not found` });

    const price = product.offerPrice || product.price;
    itemsPrice += price * (item.quantity || 1);

    if (item.expressDelivery && product.expressDeliveryAvailable) {
      expressCharge += (product.expressDeliveryCharge || 0) * (item.quantity || 1);
    }
    shippingCharge += product.deliveryCharge || 0;

    processedItems.push({
      product: product._id,
      name: product.name,
      image: product.images?.[0]?.url || '',
      price,
      quantity: item.quantity || 1,
      size: item.size || '',
      color: item.color || '',
      customization: item.customization || {},
      measurements: item.measurements || {},
      isCustomOrder: !!item.customization,
      expressDelivery: item.expressDelivery || false,
      giftWrap: giftWrap || false,
      giftMessage,
    });
  }

  // Apply coupon if any
  let couponRef = null;
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
    if (coupon) {
      const validation = coupon.isValid(req.user._id, itemsPrice);
      if (validation.valid) {
        couponDiscount = coupon.calculateDiscount(itemsPrice);
        couponRef = coupon._id;
        coupon.usedCount = (coupon.usedCount || 0) + 1;
        if (!coupon.usedBy.includes(req.user._id)) {
          coupon.usedBy.push(req.user._id);
        }
        await coupon.save();
      }
    }
  }

  const taxPrice = Math.round(itemsPrice * 0.05); // 5% GST
  const totalPrice = itemsPrice + shippingCharge + expressCharge + giftWrapCharge + taxPrice - couponDiscount;

  const order = await Order.create({
    user: req.user._id,
    items: processedItems,
    shippingAddress,
    paymentMethod: 'booking',
    paymentStatus: 'booking',
    status: 'Pending Confirmation',
    itemsPrice,
    shippingCharge,
    expressCharge,
    giftWrapCharge,
    taxPrice,
    couponDiscount,
    coupon: couponRef,
    totalPrice,
    customerNotes,
    trackingHistory: [{ status: 'Pending Confirmation', message: 'Order booking received. Pending studio confirmation.', updatedBy: 'system' }],
    estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN'),
  });

  // Update product stock if applicable
  for (const item of processedItems) {
    if (item.product) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity, soldCount: item.quantity },
      });
    }
  }

  // Update user stats
  await User.findByIdAndUpdate(req.user._id, {
    $inc: { totalOrders: 1, totalSpent: totalPrice },
  });

  // Send confirmation email
  try {
    await sendOrderConfirmationEmail({ order, user: req.user });
  } catch (e) {
    console.error('Email send failed:', e.message);
  }

  // Create notification
  await Notification.create({
    user: req.user._id,
    type: 'order_update',
    title: 'Order Booked Successfully!',
    message: `Your booking #${order.orderNumber} has been received. Our team will contact you shortly!`,
    link: `/dashboard/orders/${order._id}`,
  });

  const populatedOrder = await Order.findById(order._id)
    .populate('user', 'name email phone')
    .populate('items.product', 'name images')
    .populate('coupon', 'code discountPercent type value');

  res.status(201).json({ success: true, order: populatedOrder });
};

// @desc Get user's orders
// @route GET /api/orders/my
exports.getMyOrders = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const total = await Order.countDocuments({ user: req.user._id });
  const orders = await Order.find({ user: req.user._id })
    .sort('-createdAt')
    .skip(skip)
    .limit(Number(limit));

  res.status(200).json({ success: true, total, orders });
};

// @desc Get single order
// @route GET /api/orders/:id
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('items.product', 'name images slug price offerPrice')
      .populate('coupon', 'code discountPercent type value');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Booking order not found' });
    }

    const isAdmin = !!req.admin || (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin'));
    const orderUserId = order.user?._id ? order.user._id.toString() : order.user ? order.user.toString() : '';
    const currentUserId = req.user?._id ? req.user._id.toString() : '';
    const isOwner = currentUserId && orderUserId && currentUserId === orderUserId;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error('Error in getOrder:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving order details' });
  }
};

// @desc Get all orders (Admin)
// @route GET /api/orders
exports.getAllOrders = async (req, res) => {
  const { page = 1, limit = 50, status, search } = req.query;
  const query = {};
  if (status) query.status = status;
  if (search) query.orderNumber = { $regex: search, $options: 'i' };

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Order.countDocuments(query);
  const orders = await Order.find(query)
    .populate('user', 'name email phone')
    .sort('-createdAt')
    .skip(skip)
    .limit(Number(limit));

  res.status(200).json({ success: true, total, orders });
};

// @desc Update order status (Admin)
// @route PUT /api/orders/:id/status
exports.updateOrderStatus = async (req, res) => {
  const { status, message, adminNotes } = req.body;
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  order.status = status;
  if (adminNotes) order.adminNotes = adminNotes;
  if (status === 'delivered') order.deliveredAt = new Date();

  order.trackingHistory.push({
    status,
    message: message || `Order status updated to ${status}`,
    updatedBy: 'admin',
    timestamp: new Date(),
  });

  await order.save();

  // Notify customer
  if (order.user?._id) {
    await Notification.create({
      user: order.user._id,
      type: 'order_update',
      title: `Order Update: ${status}`,
      message: `Your order #${order.orderNumber} is now: ${status}`,
      link: `/dashboard/orders/${order._id}`,
    });

    try {
      await sendOrderStatusEmail({ order, user: order.user, newStatus: status });
    } catch (e) {
      console.error('Status email failed:', e.message);
    }
  }

  res.status(200).json({ success: true, order });
};

// @desc Delete order (Admin)
// @route DELETE /api/orders/:id
exports.deleteOrder = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  await order.deleteOne();
  res.status(200).json({ success: true, message: 'Order deleted successfully' });
};

// @desc Cancel order (Customer)
// @route PATCH /api/orders/:id/cancel
exports.cancelOrder = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  if (order.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  order.status = 'cancelled';
  order.trackingHistory.push({ status: 'cancelled', message: 'Cancelled by customer', updatedBy: 'customer' });
  await order.save();

  // Restore stock
  for (const item of order.items) {
    if (item.product) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    }
  }

  res.status(200).json({ success: true, message: 'Order cancelled successfully' });
};

// @desc Admin dashboard stats
// @route GET /api/orders/stats
exports.getOrderStats = async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [total, pending, completed, cancelled, todayOrders, recentOrders] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ status: 'Pending Confirmation' }),
    Order.countDocuments({ status: 'delivered' }),
    Order.countDocuments({ status: 'cancelled' }),
    Order.countDocuments({ createdAt: { $gte: today } }),
    Order.find().populate('user', 'name email phone').sort('-createdAt').limit(5),
  ]);

  res.status(200).json({
    success: true,
    stats: { total, pending, completed, cancelled, todayOrders },
    recentOrders,
  });
};
