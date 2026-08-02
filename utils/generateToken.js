const jwt = require('jsonwebtoken');

exports.generateToken = (id, role = 'user') => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

exports.generateRefreshToken = (id, role = 'user') => {
  return jwt.sign({ id, role }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d',
  });
};

exports.sendTokenResponse = (user, statusCode, res, role = 'user') => {
  const token = exports.generateToken(user._id, role);
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role,
      avatar: user.avatar,
    },
  });
};
