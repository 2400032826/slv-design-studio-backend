const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');

exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if token is for Admin
    if (decoded.role === 'admin' || decoded.role === 'superadmin') {
      req.admin = await Admin.findById(decoded.id).select('-password');
      if (!req.admin) {
        req.admin = { _id: decoded.id, role: decoded.role, name: 'Admin' };
      }
      req.user = { _id: decoded.id, role: decoded.role, name: req.admin.name || 'Admin', email: req.admin.email || '' };
      return next();
    }

    // Customer user token - ALWAYS verify latest status from MongoDB
    req.user = await User.findById(decoded.id).select('-password -otp -otpExpiry');
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Customer account not found' });
    }

    // CRITICAL SECURITY ENFORCEMENT: Reject immediately if user is blocked
    if (req.user.isBlocked) {
      return res.status(403).json({
        success: false,
        isBlocked: true,
        message: 'Your account has been blocked. Please contact the administrator.',
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, token invalid or expired' });
  }
};

exports.optionalAuth = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.role === 'admin' || decoded.role === 'superadmin') {
        req.admin = await Admin.findById(decoded.id).select('-password');
        req.user = { _id: decoded.id, role: decoded.role, name: 'Admin' };
      } else {
        const u = await User.findById(decoded.id).select('-password -otp -otpExpiry');
        if (u && !u.isBlocked) {
          req.user = u;
        } else {
          req.user = null;
        }
      }
    } catch (e) {
      req.user = null;
    }
  }
  next();
};
