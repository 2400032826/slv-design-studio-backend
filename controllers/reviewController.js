const Review = require('../models/Review');
const Order = require('../models/Order');

// @desc Add review
// @route POST /api/reviews
exports.addReview = async (req, res) => {
  const { product, rating, title, comment, orderId } = req.body;

  const existing = await Review.findOne({ product, user: req.user._id });
  if (existing) return res.status(400).json({ success: false, message: 'You have already reviewed this product' });

  let isVerifiedPurchase = false;
  if (orderId) {
    const order = await Order.findOne({ _id: orderId, user: req.user._id, status: 'delivered' });
    isVerifiedPurchase = !!order;
  }

  const images = req.files ? req.files.map((f) => ({ url: f.path, publicId: f.filename })) : [];

  const review = await Review.create({
    product,
    user: req.user._id,
    order: orderId,
    rating,
    title,
    comment,
    images,
    isVerifiedPurchase,
  });

  await review.populate('user', 'name avatar');
  res.status(201).json({ success: true, review });
};

// @desc Get reviews for a product
// @route GET /api/reviews/:productId
exports.getProductReviews = async (req, res) => {
  const { page = 1, limit = 10, sort = '-createdAt' } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const reviews = await Review.find({ product: req.params.productId, isApproved: true })
    .populate('user', 'name avatar')
    .sort(sort)
    .skip(skip)
    .limit(Number(limit));

  const total = await Review.countDocuments({ product: req.params.productId, isApproved: true });
  res.status(200).json({ success: true, total, reviews });
};

// @desc Delete review
// @route DELETE /api/reviews/:id
exports.deleteReview = async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  await review.deleteOne();
  res.status(200).json({ success: true, message: 'Review deleted' });
};

// @desc Admin: Get all reviews
// @route GET /api/reviews
exports.getAllReviews = async (req, res) => {
  const { page = 1, limit = 20, approved } = req.query;
  const query = {};
  if (approved !== undefined) query.isApproved = approved === 'true';
  const reviews = await Review.find(query)
    .populate('user', 'name email')
    .populate('product', 'name images')
    .sort('-createdAt')
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));
  const total = await Review.countDocuments(query);
  res.status(200).json({ success: true, total, reviews });
};

// @desc Admin: Approve/reject review
// @route PATCH /api/reviews/:id/approve
exports.toggleApproval = async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
  review.isApproved = !review.isApproved;
  await review.save();
  res.status(200).json({ success: true, isApproved: review.isApproved });
};

// @desc Admin: Reply to review
// @route POST /api/reviews/:id/reply
exports.replyToReview = async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
  review.adminReply = { text: req.body.text, repliedAt: new Date() };
  await review.save();
  res.status(200).json({ success: true, review });
};
