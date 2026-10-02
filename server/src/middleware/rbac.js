const { sendError } = require('../shared/response');

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, { code: 'UNAUTHORIZED', message: 'User not authenticated' }, 401);
    }
    if (!roles.includes(req.user.role)) {
      return sendError(res, { code: 'FORBIDDEN', message: 'Insufficient permissions' }, 403);
    }
    next();
  };
};

module.exports = requireRole;
