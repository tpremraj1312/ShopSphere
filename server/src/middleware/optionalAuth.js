const jwt = require('jsonwebtoken');
const User = require('../modules/users/user.model');

const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_for_dev');
      const user = await User.findById(decoded.id).select('-passwordHash -twoFactorSecret');
      if (user && user.status !== 'suspended') {
        req.user = user;
      }
    }
  } catch (err) {
    // Silently continue as unauthenticated / guest
  }
  next();
};

module.exports = optionalAuth;
