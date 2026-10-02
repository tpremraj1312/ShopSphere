const { TOTP, Secret } = require('otpauth');
const crypto = require('crypto');
const QRCode = require('qrcode');
const User = require('../users/user.model');

/**
 * TwoFactorService — TOTP-based 2FA (AUTH-FR-06, SEC-17)
 *
 * Design decisions:
 * - Uses otpauth library for TOTP generation/validation (RFC 6238)
 * - Secrets are encrypted at application layer before storage (SEC-17)
 * - Mandatory for admin/super_admin roles, optional for customer/seller
 * - Recovery codes provided on setup for account recovery
 */

const ENCRYPTION_KEY = process.env.TWO_FA_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex').substring(0, 64);
const ALGORITHM = 'aes-256-gcm';

/**
 * Encrypt a secret before storing in the database (SEC-17)
 */
function encryptSecret(plaintext) {
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt a stored secret
 */
function decryptSecret(ciphertext) {
  const [ivHex, authTagHex, encryptedHex] = ciphertext.split(':');
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

class TwoFactorService {
  /**
   * Generate a new TOTP secret for the user
   * Returns the secret, QR code URI, and recovery codes
   */
  async setupTwoFactor(userId) {
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      err.code = 'USER_NOT_FOUND';
      err.isOperational = true;
      throw err;
    }

    // Generate a new secret
    const secret = new Secret({ size: 20 });

    // Create TOTP instance
    const totp = new TOTP({
      issuer: 'ShopSphere',
      label: user.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret
    });

    // Generate recovery codes
    const recoveryCodes = Array.from({ length: 8 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );

    // Store encrypted secret and hashed recovery codes (not enabled yet — needs verification)
    user.twoFactorSecret = encryptSecret(secret.base32);
    user.twoFactorRecoveryCodes = recoveryCodes.map(code =>
      crypto.createHash('sha256').update(code).digest('hex')
    );
    user.twoFactorPending = true; // Not yet verified
    await user.save();

    const qrCodeDataUrl = await QRCode.toDataURL(totp.toString());

    return {
      secret: secret.base32,
      otpauthUrl: totp.toString(),
      qrCodeDataUrl,
      recoveryCodes
    };
  }

  /**
   * Verify a TOTP code and finalize 2FA setup
   */
  async verifyAndEnable(userId, code) {
    const user = await User.findById(userId);
    if (!user || !user.twoFactorSecret) {
      const err = new Error('2FA setup not initiated');
      err.statusCode = 400;
      err.code = 'TWO_FA_NOT_SETUP';
      err.isOperational = true;
      throw err;
    }

    const secretBase32 = decryptSecret(user.twoFactorSecret);
    const isValid = this._verifyCode(secretBase32, code);

    if (!isValid) {
      const err = new Error('Invalid verification code');
      err.statusCode = 400;
      err.code = 'INVALID_2FA_CODE';
      err.isOperational = true;
      throw err;
    }

    user.twoFactorEnabled = true;
    user.twoFactorPending = false;
    await user.save();

    return { enabled: true };
  }

  /**
   * Validate a TOTP code for an existing 2FA-enabled user
   */
  async validateCode(userId, code) {
    const user = await User.findById(userId);
    if (!user || !user.twoFactorEnabled) {
      return false;
    }

    // 1. Check if temporary TextBee SMS 2FA code matches
    if (user.twoFactorPendingCode && user.twoFactorPendingExpires && user.twoFactorPendingExpires > new Date()) {
      const hashed = crypto.createHash('sha256').update(code).digest('hex');
      if (hashed === user.twoFactorPendingCode) {
        user.twoFactorPendingCode = undefined;
        user.twoFactorPendingExpires = undefined;
        await user.save();
        return true;
      }
    }

    // 2. Check TOTP authenticator code
    if (!user.twoFactorSecret) return false;
    const secretBase32 = decryptSecret(user.twoFactorSecret);
    return this._verifyCode(secretBase32, code);
  }

  /**
   * Validate a recovery code (one-time use)
   */
  async validateRecoveryCode(userId, recoveryCode) {
    const user = await User.findById(userId);
    if (!user || !user.twoFactorEnabled) return false;

    const hashedCode = crypto.createHash('sha256').update(recoveryCode.toUpperCase()).digest('hex');
    const codeIndex = user.twoFactorRecoveryCodes?.indexOf(hashedCode);

    if (codeIndex === -1 || codeIndex === undefined) return false;

    // Remove used recovery code (one-time use)
    user.twoFactorRecoveryCodes.splice(codeIndex, 1);
    await user.save();

    return true;
  }

  /**
   * Disable 2FA for a user
   */
  async disableTwoFactor(userId) {
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      err.code = 'USER_NOT_FOUND';
      err.isOperational = true;
      throw err;
    }

    // Admin roles cannot disable 2FA (it's mandatory for them)
    if (['admin', 'super_admin'].includes(user.role)) {
      const err = new Error('2FA is mandatory for admin accounts');
      err.statusCode = 403;
      err.code = 'TWO_FA_MANDATORY';
      err.isOperational = true;
      throw err;
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    user.twoFactorRecoveryCodes = undefined;
    user.twoFactorPending = false;
    await user.save();

    return { disabled: true };
  }

  /**
   * Check if 2FA is required for login
   */
  async isTwoFactorRequired(userId) {
    const user = await User.findById(userId);
    if (!user) return false;
    return user.twoFactorEnabled === true;
  }

  /**
   * Internal TOTP verification
   */
  _verifyCode(secretBase32, code) {
    const totp = new TOTP({
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: Secret.fromBase32(secretBase32)
    });

    // Allow 1 period window (±30 seconds) for clock drift
    const delta = totp.validate({ token: code, window: 1 });
    return delta !== null;
  }

  /**
   * Send 2FA verification code via TextBee SMS
   */
  async sendSmsTwoFactorCode(userId) {
    const user = await User.findById(userId);
    if (!user || !user.phone) {
      const err = new Error('No registered phone number found on account for SMS 2FA');
      err.statusCode = 400;
      err.code = 'PHONE_REQUIRED';
      throw err;
    }

    const smsProvider = require('../../shared/sms');
    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store temporary code with 10m TTL
    user.twoFactorPendingCode = crypto.createHash('sha256').update(code).digest('hex');
    user.twoFactorPendingExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await smsProvider.send2FACode(user.phone, code);
    return { success: true, message: '2FA verification code sent via TextBee SMS' };
  }
}

module.exports = new TwoFactorService();
