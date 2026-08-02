const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema({
  label: { type: String, default: 'Home' },
  fullName: String,
  phone: String,
  address: String,
  city: String,
  state: String,
  pincode: String,
  isDefault: { type: Boolean, default: false },
});

const measurementSchema = new mongoose.Schema({
  label: { type: String, default: 'My Measurements' },
  chest: Number,
  waist: Number,
  hips: Number,
  shoulder: Number,
  armLength: Number,
  blouseLength: Number,
  neckDepth: Number,
  notes: String,
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required'], trim: true },
  email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  avatar: { type: String, default: '' },
  isEmailVerified: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
  otp: { type: String },
  otpExpiry: { type: Date },
  resetPasswordToken: String,
  resetPasswordExpiry: Date,
  addresses: [addressSchema],
  measurements: [measurementSchema],
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  recentlyViewed: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  notifications: { email: { type: Boolean, default: true }, orders: { type: Boolean, default: true }, offers: { type: Boolean, default: true } },
  referralCode: String,
  loyaltyPoints: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
}, { timestamps: true });

userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre('save', async function (next) {
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
