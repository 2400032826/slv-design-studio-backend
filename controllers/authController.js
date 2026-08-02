const User = require('../models/User');
const { generateOTP, OTP_EXPIRY_MINUTES } = require('../utils/generateOTP');
const { generateSecureToken } = require('../utils/generateOTP');
const { sendOTPEmail, sendPasswordResetEmail } = require('../utils/sendEmail');
const { generateToken, sendTokenResponse } = require('../utils/generateToken');
const Admin = require('../models/Admin');
const crypto = require('crypto');

// @desc    Send OTP to customer email
// @route   POST /api/auth/send-otp
// @access  Public
exports.sendOTP = async (req, res) => {
  const { email, name } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email address is required' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  let user = await User.findOne({ email: normalizedEmail });

  // Check if existing user is blocked
  if (user && user.isBlocked) {
    return res.status(403).json({
      success: false,
      isBlocked: true,
      message: 'Your account has been blocked. Please contact the administrator.',
    });
  }

  // Existing user flow -> Ask only for email, send OTP directly
  if (user) {
    if (name && name.trim()) {
      user.name = name.trim();
    }
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    await sendOTPEmail({ email: user.email, name: user.name, otp });

    return res.status(200).json({
      success: true,
      message: `OTP sent successfully to ${user.email}`,
      isNewUser: false,
      requiresName: false,
    });
  }

  // New user flow - if name is not provided, instruct frontend to display Full Name input field
  if (!name || !name.trim()) {
    return res.status(200).json({
      success: true,
      isNewUser: true,
      requiresName: true,
      message: 'New user detected. Please enter your Full Name to continue.',
    });
  }

  // New user with Full Name provided -> create user and send OTP
  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    otp,
    otpExpiry,
    isEmailVerified: false,
  });

  await sendOTPEmail({ email: user.email, name: user.name, otp });

  res.status(200).json({
    success: true,
    message: `OTP sent successfully to ${user.email}`,
    isNewUser: true,
    requiresName: false,
  });
};

// @desc    Verify OTP and login/register
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = async (req, res) => {
  const { email, otp, name } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and OTP are required' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  let user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    return res.status(404).json({ success: false, message: 'User account not found. Please request a new OTP.' });
  }

  // Check if user is blocked
  if (user.isBlocked) {
    return res.status(403).json({
      success: false,
      isBlocked: true,
      message: 'Your account has been blocked. Please contact the administrator.',
    });
  }

  if (!user.otp || user.otp !== otp.trim()) {
    return res.status(400).json({ success: false, message: 'Invalid OTP. Please check the 6-digit code and try again.' });
  }

  if (new Date() > user.otpExpiry) {
    return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new code.' });
  }

  if (name && name.trim()) {
    user.name = name.trim();
  }

  user.otp = undefined;
  user.otpExpiry = undefined;
  user.isEmailVerified = true;
  await user.save();

  sendTokenResponse(user, 200, res);
};

// @desc    Check email registration status
// @route   POST /api/auth/check-email
// @access  Public
exports.checkEmail = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  if (user && user.isBlocked) {
    return res.status(403).json({
      success: false,
      isBlocked: true,
      message: 'Your account has been blocked. Please contact the administrator.',
    });
  }

  res.status(200).json({
    success: true,
    exists: !!user,
    isNewUser: !user,
    name: user ? user.name : null,
  });
};

// @desc    Separate Admin Login (password based, NO OTP)
// @route   POST /api/auth/admin-login
// @access  Public
exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Admin email and password are required' });
  }

  const inputEmail = email.toLowerCase().trim();
  const envAdminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
  const envAdminPassword = process.env.ADMIN_PASSWORD;

  // 1. Authenticate against environment variable credentials
  if (inputEmail === envAdminEmail && password === envAdminPassword) {
    let admin = await Admin.findOne({ email: envAdminEmail });
    if (!admin) {
      admin = await Admin.create({
        name: 'Super Admin',
        email: envAdminEmail,
        password: envAdminPassword,
        role: 'superadmin',
      });
    }
    admin.lastLogin = new Date();
    await admin.save({ validateBeforeSave: false });

    const token = generateToken(admin._id, 'admin');
    return res.status(200).json({
      success: true,
      token,
      admin: { _id: admin._id, name: admin.name, email: admin.email, role: admin.role },
    });
  }

  // 2. Authenticate against database admin records
  const admin = await Admin.findOne({ email: inputEmail }).select('+password');
  if (!admin || !(await admin.matchPassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid admin email or password' });
  }

  admin.lastLogin = new Date();
  await admin.save({ validateBeforeSave: false });

  const token = generateToken(admin._id, 'admin');
  res.status(200).json({
    success: true,
    token,
    admin: { _id: admin._id, name: admin.name, email: admin.email, role: admin.role },
  });
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('wishlist', 'name images price offerPrice')
    .select('-otp -otpExpiry -resetPasswordToken -resetPasswordExpiry');

  res.status(200).json({ success: true, user });
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  const { name, phone, avatar } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, phone, avatar },
    { new: true, runValidators: true }
  ).select('-otp -otpExpiry');

  res.status(200).json({ success: true, user });
};

// @desc    Add/Update address
// @route   POST /api/auth/address
// @access  Private
exports.addAddress = async (req, res) => {
  const user = await User.findById(req.user._id);
  const { label, fullName, phone, address, city, state, pincode, isDefault } = req.body;

  if (isDefault) {
    user.addresses.forEach((addr) => (addr.isDefault = false));
  }

  user.addresses.push({ label, fullName, phone, address, city, state, pincode, isDefault });
  await user.save();

  res.status(201).json({ success: true, addresses: user.addresses });
};

// @desc    Delete address
// @route   DELETE /api/auth/address/:id
// @access  Private
exports.deleteAddress = async (req, res) => {
  const user = await User.findById(req.user._id);
  user.addresses = user.addresses.filter((a) => a._id.toString() !== req.params.id);
  await user.save();
  res.status(200).json({ success: true, addresses: user.addresses });
};

// @desc    Save measurement
// @route   POST /api/auth/measurements
// @access  Private
exports.saveMeasurement = async (req, res) => {
  const user = await User.findById(req.user._id);
  user.measurements.push(req.body);
  await user.save();
  res.status(201).json({ success: true, measurements: user.measurements });
};

// @desc    Add to wishlist
// @route   POST /api/auth/wishlist/:productId
// @access  Private
exports.toggleWishlist = async (req, res) => {
  const user = await User.findById(req.user._id);
  const productId = req.params.productId;
  const index = user.wishlist.indexOf(productId);

  if (index === -1) {
    user.wishlist.push(productId);
  } else {
    user.wishlist.splice(index, 1);
  }

  await user.save();
  res.status(200).json({
    success: true,
    inWishlist: index === -1,
    wishlist: user.wishlist,
  });
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  const user = await User.findOne({ email: req.body.email.toLowerCase().trim() });
  if (!user) {
    return res.status(404).json({ success: false, message: 'No user with that email' });
  }

  if (user.isBlocked) {
    return res.status(403).json({ success: false, isBlocked: true, message: 'Your account has been blocked. Please contact the administrator.' });
  }

  const resetToken = generateSecureToken();
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpiry = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  const resetURL = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  await sendPasswordResetEmail({ email: user.email, name: user.name, resetURL });

  res.status(200).json({ success: true, message: 'Password reset email sent' });
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpiry: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ success: false, message: 'Invalid or expired token' });
  }

  if (user.isBlocked) {
    return res.status(403).json({ success: false, isBlocked: true, message: 'Your account has been blocked. Please contact the administrator.' });
  }

  user.otp = generateOTP();
  user.otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpiry = undefined;
  await user.save();

  await sendOTPEmail({ email: user.email, name: user.name, otp: user.otp });

  res.status(200).json({ success: true, message: 'OTP sent to your email. Use it to login.' });
};
