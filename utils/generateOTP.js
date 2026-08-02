const crypto = require('crypto');

exports.generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

exports.generateSecureToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

exports.OTP_EXPIRY_MINUTES = 10;
