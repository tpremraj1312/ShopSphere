const User = require('../users/user.model');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const emailService = require('../../shared/email');
const RefreshToken = require('./refreshToken.model');

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'fallback_secret_for_dev',
    { expiresIn: '7d' }
  );
};

const registerUser = async (email, password) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const err = new Error('Email already registered');
    err.code = 'EMAIL_EXISTS';
    err.statusCode = 400;
    err.isOperational = true;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const user = new User({
    email,
    passwordHash,
    verificationToken,
    verificationTokenExpires
  });

  await user.save();
  await emailService.sendVerificationEmail(email, verificationToken);

  return { id: user._id, email: user.email };
};

const verifyEmail = async (token) => {
  const user = await User.findOne({
    verificationToken: token,
    verificationTokenExpires: { $gt: Date.now() }
  });

  if (!user) {
    const err = new Error('Invalid or expired verification token');
    err.code = 'INVALID_TOKEN';
    err.statusCode = 400;
    err.isOperational = true;
    throw err;
  }

  user.emailVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpires = undefined;
  await user.save();
};

const loginUser = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) {
    const err = new Error('Invalid email or password');
    err.code = 'INVALID_CREDENTIALS';
    err.statusCode = 401;
    err.isOperational = true;
    throw err;
  }

  if (!user.emailVerified) {
    const err = new Error('Email not verified');
    err.code = 'EMAIL_NOT_VERIFIED';
    err.statusCode = 403;
    err.isOperational = true;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    const err = new Error('Invalid email or password');
    err.code = 'INVALID_CREDENTIALS';
    err.statusCode = 401;
    err.isOperational = true;
    throw err;
  }

  if (user.twoFactorEnabled) {
    const tempToken = jwt.sign(
      { id: user._id, role: user.role, type: '2fa_pending' },
      process.env.JWT_SECRET || 'fallback_secret_for_dev',
      { expiresIn: '5m' }
    );
    return {
      requiresTwoFactor: true,
      tempToken,
      user: { id: user._id, email: user.email, role: user.role }
    };
  }

  const accessToken = generateAccessToken(user);
  
  const refreshTokenString = crypto.randomBytes(40).toString('hex');
  const familyId = crypto.randomBytes(16).toString('hex');
  
  const refreshToken = new RefreshToken({
    userId: user._id,
    token: refreshTokenString,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    familyId: familyId
  });
  
  await refreshToken.save();

  return { user: { id: user._id, email: user.email, role: user.role }, accessToken, refreshToken: refreshTokenString };
};

const verifyTwoFactorLogin = async (tempToken, code, recoveryCode) => {
  const twoFactorService = require('./twoFactor.service');

  if (!tempToken) {
    const err = new Error('Two-factor session token required');
    err.code = 'UNAUTHORIZED';
    err.statusCode = 401;
    err.isOperational = true;
    throw err;
  }

  let decoded;
  try {
    decoded = jwt.verify(tempToken, process.env.JWT_SECRET || 'fallback_secret_for_dev');
  } catch (e) {
    const err = new Error('Invalid or expired 2FA session');
    err.code = 'UNAUTHORIZED';
    err.statusCode = 401;
    err.isOperational = true;
    throw err;
  }

  if (decoded.type !== '2fa_pending') {
    const err = new Error('Invalid token type');
    err.code = 'UNAUTHORIZED';
    err.statusCode = 401;
    err.isOperational = true;
    throw err;
  }

  const user = await User.findById(decoded.id);
  if (!user || user.status === 'suspended') {
    const err = new Error('User not found or suspended');
    err.code = 'UNAUTHORIZED';
    err.statusCode = 401;
    err.isOperational = true;
    throw err;
  }

  let valid = false;
  if (code) {
    valid = await twoFactorService.validateCode(user._id, code);
  } else if (recoveryCode) {
    valid = await twoFactorService.validateRecoveryCode(user._id, recoveryCode);
  }

  if (!valid) {
    const err = new Error('Invalid 2FA code or recovery code');
    err.code = 'INVALID_2FA_CODE';
    err.statusCode = 401;
    err.isOperational = true;
    throw err;
  }

  const accessToken = generateAccessToken(user);
  const refreshTokenString = crypto.randomBytes(40).toString('hex');
  const familyId = crypto.randomBytes(16).toString('hex');

  const refreshToken = new RefreshToken({
    userId: user._id,
    token: refreshTokenString,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    familyId
  });
  await refreshToken.save();

  return {
    user: { id: user._id, email: user.email, role: user.role },
    accessToken,
    refreshToken: refreshTokenString
  };
};

const refreshAuthToken = async (refreshTokenString) => {
  if (!refreshTokenString) {
    const err = new Error('Refresh token is required');
    err.code = 'UNAUTHORIZED';
    err.statusCode = 401;
    err.isOperational = true;
    throw err;
  }

  const tokenRecord = await RefreshToken.findOne({ token: refreshTokenString }).populate('userId');
  
  if (tokenRecord && tokenRecord.isRevoked) {
    await RefreshToken.updateMany({ familyId: tokenRecord.familyId }, { isRevoked: true });
    const err = new Error('Invalid refresh token');
    err.code = 'UNAUTHORIZED';
    err.statusCode = 401;
    err.isOperational = true;
    throw err;
  }

  if (!tokenRecord || tokenRecord.expiresAt < Date.now()) {
    const err = new Error('Refresh token is invalid or expired');
    err.code = 'UNAUTHORIZED';
    err.statusCode = 401;
    err.isOperational = true;
    throw err;
  }

  tokenRecord.isRevoked = true;
  await tokenRecord.save();
  
  const user = tokenRecord.userId;
  const accessToken = generateAccessToken(user);
  const newRefreshTokenString = crypto.randomBytes(40).toString('hex');
  
  const newRefreshToken = new RefreshToken({
    userId: user._id,
    token: newRefreshTokenString,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    familyId: tokenRecord.familyId
  });
  
  await newRefreshToken.save();

  return { accessToken, refreshToken: newRefreshTokenString };
};

const logoutUser = async (refreshTokenString) => {
  if (refreshTokenString) {
    const tokenRecord = await RefreshToken.findOne({ token: refreshTokenString });
    if (tokenRecord) {
      tokenRecord.isRevoked = true;
      await tokenRecord.save();
    }
  }
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) return;

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
  await user.save();

  await emailService.sendPasswordResetEmail(email, resetToken);
};

const resetPassword = async (token, newPassword) => {
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    const err = new Error('Invalid or expired password reset token');
    err.code = 'INVALID_TOKEN';
    err.statusCode = 400;
    err.isOperational = true;
    throw err;
  }

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  
  await RefreshToken.updateMany({ userId: user._id }, { isRevoked: true });
  await user.save();
};

const getSessions = async (userId) => {
  const tokens = await RefreshToken.find({ userId, isRevoked: false });
  return tokens.map(t => ({ id: t._id, familyId: t.familyId, createdAt: t.createdAt, expiresAt: t.expiresAt }));
};

const revokeSession = async (userId, sessionId) => {
  const token = await RefreshToken.findOne({ _id: sessionId, userId });
  if (token) {
    await RefreshToken.updateMany({ familyId: token.familyId }, { isRevoked: true });
  }
};

module.exports = {
  registerUser,
  verifyEmail,
  loginUser,
  refreshAuthToken,
  logoutUser,
  forgotPassword,
  resetPassword,
  getSessions,
  revokeSession,
  verifyTwoFactorLogin
};
