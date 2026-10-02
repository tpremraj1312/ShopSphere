const authService = require('./auth.service');
const { sendSuccess } = require('../../shared/response');

const register = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    await authService.registerUser(email, password);
    return sendSuccess(res, { message: 'Registration successful. Please check your email to verify your account.' }, null, 201);
  } catch (error) {
    next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;
    await authService.verifyEmail(token);
    return sendSuccess(res, { message: 'Email verified successfully. You can now log in.' });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);
    
    if (result.requiresTwoFactor) {
      return sendSuccess(res, {
        requiresTwoFactor: true,
        tempToken: result.tempToken,
        user: result.user
      }, null, 200);
    }

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return sendSuccess(res, { user: result.user, accessToken: result.accessToken }, null, 200);
  } catch (error) {
    next(error);
  }
};

const loginWith2FA = async (req, res, next) => {
  try {
    const { tempToken, code, recoveryCode } = req.body;
    const { user, accessToken, refreshToken } = await authService.verifyTwoFactorLogin(tempToken, code, recoveryCode);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return sendSuccess(res, { user, accessToken }, null, 200);
  } catch (error) {
    next(error);
  }
};

const setup2FA = async (req, res, next) => {
  try {
    const twoFactorService = require('./twoFactor.service');
    const result = await twoFactorService.setupTwoFactor(req.user._id);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

const verify2FA = async (req, res, next) => {
  try {
    const { code } = req.body;
    const twoFactorService = require('./twoFactor.service');
    const result = await twoFactorService.verifyAndEnable(req.user._id, code);
    return sendSuccess(res, { message: 'Two-factor authentication enabled successfully', ...result });
  } catch (error) {
    next(error);
  }
};

const disable2FA = async (req, res, next) => {
  try {
    const twoFactorService = require('./twoFactor.service');
    const result = await twoFactorService.disableTwoFactor(req.user._id);
    return sendSuccess(res, { message: 'Two-factor authentication disabled', ...result });
  } catch (error) {
    next(error);
  }
};

const get2FAStatus = async (req, res, next) => {
  try {
    const User = require('../users/user.model');
    const user = await User.findById(req.user._id).select('twoFactorEnabled');
    return sendSuccess(res, { twoFactorEnabled: !!user?.twoFactorEnabled });
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken: currentRefreshToken } = req.cookies;
    const { accessToken, refreshToken } = await authService.refreshAuthToken(currentRefreshToken);
    
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return sendSuccess(res, { accessToken }, null, 200);
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;
    await authService.logoutUser(refreshToken);
    
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax'
    });

    return sendSuccess(res, { message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    await authService.forgotPassword(email);
    // Always return success to prevent email enumeration
    return sendSuccess(res, { message: 'If that email is registered, we have sent a password reset link.' });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    await authService.resetPassword(token, password);
    return sendSuccess(res, { message: 'Password has been reset successfully. You can now log in.' });
  } catch (error) {
    next(error);
  }
};

const getSessions = async (req, res, next) => {
  try {
    const sessions = await authService.getSessions(req.user._id);
    return sendSuccess(res, sessions);
  } catch (error) {
    next(error);
  }
};

const revokeSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    await authService.revokeSession(req.user._id, id);
    return sendSuccess(res, { message: 'Session revoked successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  verifyEmail,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  getSessions,
  revokeSession,
  loginWith2FA,
  setup2FA,
  verify2FA,
  disable2FA,
  get2FAStatus
};
