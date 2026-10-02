const jwt = require('jsonwebtoken');
const { sendError } = require('../shared/response');
const User = require('../modules/users/user.model');

const requireAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return sendError(res, { code: 'UNAUTHORIZED', message: 'Not authorized to access this route' }, 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_for_dev');
    const user = await User.findById(decoded.id).select('-passwordHash -twoFactorSecret');
    
    if (!user) {
      return sendError(res, { code: 'UNAUTHORIZED', message: 'User not found' }, 401);
    }

    if (user.status === 'suspended') {
      return sendError(res, { code: 'FORBIDDEN', message: 'User account is suspended' }, 403);
    }

    req.user = user;
    next();
  } catch (error) {
    return sendError(res, { code: 'UNAUTHORIZED', message: 'Not authorized, token failed' }, 401);
  }
};

module.exports = requireAuth;
