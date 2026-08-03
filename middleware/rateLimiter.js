const rateLimit = require('express-rate-limit');

exports.globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
});

exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many auth attempts, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
});

exports.otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 50,
  message: { success: false, message: 'Too many OTP requests, please wait 10 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
});
