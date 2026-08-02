const Coupon = require('../models/Coupon');

// @desc Get public active coupons for customer website / homepage
// @route GET /api/coupons/public
exports.getPublicCoupons = async (req, res) => {
  const coupons = await Coupon.find({ isActive: true, expiresAt: { $gt: new Date() } })
    .select('code type value minOrderAmount maxDiscount description expiresAt')
    .sort('-createdAt');
  res.status(200).json({ success: true, coupons });
};

// @desc Validate coupon during checkout
// @route POST /api/coupons/validate
exports.validateCoupon = async (req, res) => {
  const { code, orderAmount } = req.body;
  if (!code) return res.status(400).json({ success: false, message: 'Coupon code is required' });

  const coupon = await Coupon.findOne({ code: code.toUpperCase().trim(), isActive: true });
  if (!coupon) return res.status(404).json({ success: false, message: 'Invalid or inactive coupon code' });

  const validation = coupon.isValid(req.user._id, Number(orderAmount || 0));
  if (!validation.valid) return res.status(400).json({ success: false, message: validation.message });

  const discount = coupon.calculateDiscount(Number(orderAmount || 0));
  const discountPercent = coupon.type === 'percentage' ? coupon.value : Math.round((discount / (orderAmount || 1)) * 100);

  res.status(200).json({
    success: true,
    coupon: {
      _id: coupon._id,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discountPercent,
      discountAmount: discount,
    },
  });
};

// @desc Admin: Create new coupon
// @route POST /api/coupons
exports.createCoupon = async (req, res) => {
  const data = { ...req.body };

  if (!data.code || !data.code.trim()) {
    return res.status(400).json({ success: false, message: 'Coupon code is required' });
  }

  data.code = data.code.toUpperCase().trim();
  data.type = data.type || 'percentage';
  data.value = Number(data.value || data.discountPercent || 10);
  data.minOrderAmount = Number(data.minOrderAmount || 0);

  if (data.maxUses || data.usageLimit) {
    data.usageLimit = Number(data.maxUses || data.usageLimit);
  }

  if (!data.expiresAt) {
    data.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  } else {
    data.expiresAt = new Date(data.expiresAt);
  }

  const existing = await Coupon.findOne({ code: data.code });
  if (existing) {
    return res.status(400).json({ success: false, message: `Coupon ${data.code} already exists` });
  }

  const coupon = await Coupon.create({
    ...data,
    createdBy: req.admin?._id,
  });

  res.status(201).json({ success: true, coupon });
};

// @desc Admin: Get all coupons
// @route GET /api/coupons
exports.getCoupons = async (req, res) => {
  const coupons = await Coupon.find().sort('-createdAt');
  res.status(200).json({ success: true, coupons });
};

// @desc Admin: Update coupon
// @route PUT /api/coupons/:id
exports.updateCoupon = async (req, res) => {
  const data = { ...req.body };
  if (data.code) data.code = data.code.toUpperCase().trim();
  if (data.discountPercent) data.value = Number(data.discountPercent);

  const coupon = await Coupon.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
  if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
  res.status(200).json({ success: true, coupon });
};

// @desc Admin: Toggle coupon active status
// @route PATCH /api/coupons/:id/toggle
exports.toggleCoupon = async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
  coupon.isActive = !coupon.isActive;
  await coupon.save();
  res.status(200).json({ success: true, isActive: coupon.isActive, coupon });
};

// @desc Admin: Delete coupon
// @route DELETE /api/coupons/:id
exports.deleteCoupon = async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
  await coupon.deleteOne();
  res.status(200).json({ success: true, message: 'Coupon deleted successfully' });
};
