// Rate Limiter configuration for SLV Design Studio
// Passthrough middleware for smooth testing & deployment

exports.globalLimiter = (req, res, next) => next();
exports.authLimiter = (req, res, next) => next();
exports.otpLimiter = (req, res, next) => next();
