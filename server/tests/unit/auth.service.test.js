const { test, describe } = require('node:test');
const assert = require('node:assert');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const authService = require('../../src/modules/auth/auth.service');
const User = require('../../src/modules/users/user.model');
const RefreshToken = require('../../src/modules/auth/refreshToken.model');

describe('Auth Service Primitives & Security', () => {
  test('bcrypt hashes passwords with salt rounds = 12 (SEC-01)', async () => {
    const plainPassword = 'SuperSecretPassword123!';
    const hash = await bcrypt.hash(plainPassword, 12);

    assert.ok(hash.startsWith('$2b$12$') || hash.startsWith('$2a$12$'));
    const isMatch = await bcrypt.compare(plainPassword, hash);
    assert.strictEqual(isMatch, true);

    const isWrong = await bcrypt.compare('WrongPassword', hash);
    assert.strictEqual(isWrong, false);
  });

  test('JWT generates and validates token with claims (id, role)', () => {
    const secret = 'test_jwt_secret_key_12345';
    const payload = { id: '65f1234567890abcdef12345', role: 'customer' };

    const token = jwt.sign(payload, secret, { expiresIn: '15m' });
    assert.ok(token && typeof token === 'string');

    const decoded = jwt.verify(token, secret);
    assert.strictEqual(decoded.id, payload.id);
    assert.strictEqual(decoded.role, payload.role);
  });

  test('JWT rejects expired token', async () => {
    const secret = 'test_jwt_secret_key_12345';
    const payload = { id: '65f1234567890abcdef12345', role: 'customer' };

    const token = jwt.sign(payload, secret, { expiresIn: '1ms' });
    
    // Wait 10ms for expiration
    await new Promise((r) => setTimeout(r, 10));

    assert.throws(
      () => {
        jwt.verify(token, secret);
      },
      (err) => err.name === 'TokenExpiredError'
    );
  });

  test('JWT rejects token signed with wrong secret', () => {
    const secret = 'test_jwt_secret_key_12345';
    const wrongSecret = 'different_secret_key_67890';
    const payload = { id: '65f1234567890abcdef12345', role: 'customer' };

    const token = jwt.sign(payload, secret, { expiresIn: '15m' });

    assert.throws(
      () => {
        jwt.verify(token, wrongSecret);
      },
      (err) => err.name === 'JsonWebTokenError'
    );
  });

  describe('Service Logic Execution', () => {
    test('loginUser rejects non-existent email', async () => {
      const origFindOne = User.findOne;
      User.findOne = () => Promise.resolve(null);

      try {
        await assert.rejects(
          async () => {
            await authService.loginUser('ghost@example.com', 'password123');
          },
          (err) => {
            assert.strictEqual(err.statusCode, 401);
            assert.strictEqual(err.code, 'INVALID_CREDENTIALS');
            return true;
          }
        );
      } finally {
        User.findOne = origFindOne;
      }
    });

    test('loginUser rejects unverified email (AUTH-FR-02)', async () => {
      const origFindOne = User.findOne;
      User.findOne = () => Promise.resolve({
        email: 'unverified@example.com',
        emailVerified: false
      });

      try {
        await assert.rejects(
          async () => {
            await authService.loginUser('unverified@example.com', 'password123');
          },
          (err) => {
            assert.strictEqual(err.statusCode, 403);
            assert.strictEqual(err.code, 'EMAIL_NOT_VERIFIED');
            return true;
          }
        );
      } finally {
        User.findOne = origFindOne;
      }
    });

    test('loginUser rejects wrong password', async () => {
      const origFindOne = User.findOne;
      const hash = await bcrypt.hash('CorrectPassword123!', 12);
      User.findOne = () => Promise.resolve({
        email: 'test@example.com',
        emailVerified: true,
        passwordHash: hash
      });

      try {
        await assert.rejects(
          async () => {
            await authService.loginUser('test@example.com', 'WrongPassword123!');
          },
          (err) => {
            assert.strictEqual(err.statusCode, 401);
            assert.strictEqual(err.code, 'INVALID_CREDENTIALS');
            return true;
          }
        );
      } finally {
        User.findOne = origFindOne;
      }
    });

    test('loginUser returns tempToken if 2FA enabled', async () => {
      const origFindOne = User.findOne;
      const hash = await bcrypt.hash('CorrectPassword123!', 12);
      const userId = new mongoose.Types.ObjectId();
      User.findOne = () => Promise.resolve({
        _id: userId,
        email: '2fa@example.com',
        emailVerified: true,
        passwordHash: hash,
        role: 'customer',
        twoFactorEnabled: true
      });

      try {
        const result = await authService.loginUser('2fa@example.com', 'CorrectPassword123!');
        assert.strictEqual(result.requiresTwoFactor, true);
        assert.ok(result.tempToken);
        assert.strictEqual(result.user.email, '2fa@example.com');
      } finally {
        User.findOne = origFindOne;
      }
    });

    test('refreshAuthToken detects reuse and revokes token family (SEC-02)', async () => {
      const origFindOne = RefreshToken.findOne;
      const origUpdateMany = RefreshToken.updateMany;
      let revokedFamilyId = null;

      RefreshToken.findOne = () => ({
        populate: () => Promise.resolve({
          token: 'stolen_revoked_token',
          isRevoked: true,
          familyId: 'family_xyz',
          userId: { _id: new mongoose.Types.ObjectId(), role: 'customer' }
        })
      });

      RefreshToken.updateMany = (query, update) => {
        revokedFamilyId = query.familyId;
        return Promise.resolve();
      };

      try {
        await assert.rejects(
          async () => {
            await authService.refreshAuthToken('stolen_revoked_token');
          },
          (err) => {
            assert.strictEqual(err.statusCode, 401);
            assert.strictEqual(revokedFamilyId, 'family_xyz');
            return true;
          }
        );
      } finally {
        RefreshToken.findOne = origFindOne;
        RefreshToken.updateMany = origUpdateMany;
      }
    });
  });
});
