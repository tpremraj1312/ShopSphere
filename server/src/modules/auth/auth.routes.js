const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const validate = require('../../middleware/validate');
const requireAuth = require('../../middleware/auth');
const { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } = require('../users/user.validation');
const { authLimiter } = require('../../middleware/rateLimiter');

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/verify-email/:token', authLimiter, authController.verifyEmail);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), authController.resetPassword);

router.get('/sessions', requireAuth, authController.getSessions);
router.delete('/sessions/:id', requireAuth, authController.revokeSession);

// 2FA Routes (AUTH-FR-06, Step 4.1.6)
router.post('/2fa/login', authLimiter, authController.loginWith2FA);
router.post('/2fa/setup', requireAuth, authController.setup2FA);
router.post('/2fa/verify', requireAuth, authController.verify2FA);
router.post('/2fa/disable', requireAuth, authController.disable2FA);
router.get('/2fa/status', requireAuth, authController.get2FAStatus);

module.exports = router;
