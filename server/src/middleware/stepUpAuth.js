const jwt = require('jsonwebtoken');
const { sendError } = require('../shared/response');

/**
 * Step-up Re-authentication (ADM-FR-05, SEC-06)
 *
 * Design: Sensitive admin actions require a short-lived "elevated action" token
 * separate from the standard session JWT. The admin must re-enter their password
 * (or provide a TOTP code) to obtain this token, which expires in 5 minutes.
 *
 * Flow:
 * 1. Admin hits POST /api/v1/admin/step-up with password/TOTP
 * 2. Server issues a stepUpToken (5-min TTL, contains actionScope)
 * 3. Subsequent sensitive endpoints check for valid stepUpToken via this middleware
 */

const STEP_UP_SECRET = process.env.STEP_UP_SECRET || 'step_up_secret_dev';
const STEP_UP_TTL = '5m';

/**
 * Generate a step-up token after re-authentication
 * @param {Object} user - Authenticated user
 * @param {string} scope - Action scope (e.g., 'admin:suspend', 'admin:refund')
 */
const generateStepUpToken = (user, scope = 'admin:elevated') => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      scope,
      type: 'step_up'
    },
    STEP_UP_SECRET,
    { expiresIn: STEP_UP_TTL }
  );
};

/**
 * Middleware: Require a valid step-up token for sensitive admin actions
 * The token must be provided in the X-Step-Up-Token header.
 */
const requireStepUp = (req, res, next) => {
  const stepUpToken = req.headers['x-step-up-token'];

  if (!stepUpToken) {
    return sendError(res, {
      code: 'STEP_UP_REQUIRED',
      message: 'This action requires step-up re-authentication. Please verify your identity first.'
    }, 403);
  }

  try {
    const decoded = jwt.verify(stepUpToken, STEP_UP_SECRET);

    if (decoded.type !== 'step_up') {
      return sendError(res, {
        code: 'INVALID_STEP_UP_TOKEN',
        message: 'Invalid step-up token type'
      }, 403);
    }

    // Verify the token belongs to the same user
    if (decoded.id !== req.user._id.toString()) {
      return sendError(res, {
        code: 'STEP_UP_USER_MISMATCH',
        message: 'Step-up token does not match current user'
      }, 403);
    }

    req.stepUpScope = decoded.scope;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, {
        code: 'STEP_UP_EXPIRED',
        message: 'Step-up token has expired. Please re-authenticate.'
      }, 403);
    }
    return sendError(res, {
      code: 'INVALID_STEP_UP_TOKEN',
      message: 'Invalid step-up token'
    }, 403);
  }
};

module.exports = { generateStepUpToken, requireStepUp, requireStepUpAuth: requireStepUp };
