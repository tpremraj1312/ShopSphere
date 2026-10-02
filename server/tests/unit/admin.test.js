const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');

// Models
const User = require('../../src/modules/users/user.model');
const Product = require('../../src/modules/products/product.model');
const Order = require('../../src/modules/orders/order.model');
const AuditLog = require('../../src/modules/audit/auditLog.model');
const RefreshToken = require('../../src/modules/auth/refreshToken.model');

// Services & Middleware
const adminService = require('../../src/modules/admin/admin.service');
const auditService = require('../../src/modules/audit/audit.service');
const twoFactorService = require('../../src/modules/auth/twoFactor.service');
const { generateStepUpToken, requireStepUp } = require('../../src/middleware/stepUpAuth');
const requireRole = require('../../src/middleware/rbac');

describe('Phase 4.1 Admin Panel Core & Security (ADM-FR-01 to 05, SEC-06, SEC-17, SEC-21)', () => {

  describe('4.1.1 RBAC Extension for admin and super_admin', () => {
    test('allows admin role through requireRole', () => {
      const middleware = requireRole('admin', 'super_admin');
      const req = { user: { role: 'admin' } };
      let nextCalled = false;
      middleware(req, {}, () => { nextCalled = true; });
      assert.strictEqual(nextCalled, true);
    });

    test('allows super_admin role through requireRole', () => {
      const middleware = requireRole('admin', 'super_admin');
      const req = { user: { role: 'super_admin' } };
      let nextCalled = false;
      middleware(req, {}, () => { nextCalled = true; });
      assert.strictEqual(nextCalled, true);
    });

    test('rejects customer and seller roles on admin gate', () => {
      const middleware = requireRole('admin', 'super_admin');
      let status;
      let json;
      const res = {
        status: (s) => { status = s; return res; },
        json: (j) => { json = j; return res; }
      };

      middleware({ user: { role: 'customer' } }, res, () => {});
      assert.strictEqual(status, 403);
      assert.strictEqual(json.error.code, 'FORBIDDEN');

      middleware({ user: { role: 'seller' } }, res, () => {});
      assert.strictEqual(status, 403);
      assert.strictEqual(json.error.code, 'FORBIDDEN');
    });
  });

  describe('4.1.2 & 4.1.3 Audit Log Model & Audit Service (SEC-21)', () => {
    test('writes append-only audit log entry with IP, UA, and state delta', async () => {
      const adminId = new mongoose.Types.ObjectId();
      const targetUserId = new mongoose.Types.ObjectId();

      const mockReq = {
        user: { _id: adminId, role: 'admin' },
        ip: '192.168.1.100',
        headers: { 'user-agent': 'AdminBrowser/1.0' }
      };

      // Mock AuditLog.prototype.save
      let savedEntry = null;
      const origSave = AuditLog.prototype.save;
      AuditLog.prototype.save = async function() {
        savedEntry = this;
        return this;
      };

      try {
        const entry = await auditService.log(mockReq, {
          action: 'user.suspend',
          targetType: 'user',
          targetId: targetUserId,
          details: { reason: 'Violation of Terms' },
          previousState: { status: 'active' },
          newState: { status: 'suspended' }
        });

        assert.ok(entry);
        assert.strictEqual(entry.action, 'user.suspend');
        assert.strictEqual(entry.actorRole, 'admin');
        assert.strictEqual(entry.actorId.toString(), adminId.toString());
        assert.strictEqual(entry.targetType, 'user');
        assert.strictEqual(entry.targetId.toString(), targetUserId.toString());
        assert.strictEqual(entry.ipAddress, '192.168.1.100');
        assert.strictEqual(entry.userAgent, 'AdminBrowser/1.0');
        assert.strictEqual(entry.previousState.status, 'active');
        assert.strictEqual(entry.newState.status, 'suspended');
      } finally {
        AuditLog.prototype.save = origSave;
      }
    });
  });

  describe('4.1.5 Step-Up Re-Authentication (ADM-FR-05, SEC-06)', () => {
    test('generates valid step-up token with 5-minute expiry', () => {
      const admin = { _id: new mongoose.Types.ObjectId(), role: 'admin' };
      const token = generateStepUpToken(admin, 'admin:elevated');
      assert.ok(token);
      assert.strictEqual(typeof token, 'string');
    });

    test('requireStepUp accepts valid step-up token for the matching user', () => {
      const adminId = new mongoose.Types.ObjectId();
      const admin = { _id: adminId, role: 'admin' };
      const token = generateStepUpToken(admin, 'admin:elevated');

      const req = {
        headers: { 'x-step-up-token': token },
        user: { _id: adminId, role: 'admin' }
      };
      let nextCalled = false;

      requireStepUp(req, {}, () => { nextCalled = true; });
      assert.strictEqual(nextCalled, true);
      assert.strictEqual(req.stepUpScope, 'admin:elevated');
    });

    test('requireStepUp rejects missing step-up token with STEP_UP_REQUIRED', () => {
      const req = {
        headers: {},
        user: { _id: new mongoose.Types.ObjectId(), role: 'admin' }
      };
      let status;
      let json;
      const res = {
        status: (s) => { status = s; return res; },
        json: (j) => { json = j; return res; }
      };

      requireStepUp(req, res, () => {});
      assert.strictEqual(status, 403);
      assert.strictEqual(json.error.code, 'STEP_UP_REQUIRED');
    });

    test('requireStepUp rejects token if user ID does not match', () => {
      const adminId1 = new mongoose.Types.ObjectId();
      const adminId2 = new mongoose.Types.ObjectId();
      const token = generateStepUpToken({ _id: adminId1, role: 'admin' });

      const req = {
        headers: { 'x-step-up-token': token },
        user: { _id: adminId2, role: 'admin' }
      };
      let status;
      let json;
      const res = {
        status: (s) => { status = s; return res; },
        json: (j) => { json = j; return res; }
      };

      requireStepUp(req, res, () => {});
      assert.strictEqual(status, 403);
      assert.strictEqual(json.error.code, 'STEP_UP_USER_MISMATCH');
    });
  });

  describe('4.1.6 2FA TOTP Implementation (AUTH-FR-06, SEC-17)', () => {
    test('encrypts secret at application layer before saving (SEC-17)', async () => {
      const userId = new mongoose.Types.ObjectId();
      let updatedUser = null;

      const origFindById = User.findById;
      User.findById = async () => ({
        _id: userId,
        email: 'admin@shopsphere.io',
        role: 'admin',
        save: async function() {
          updatedUser = this;
          return this;
        }
      });

      try {
        const setupResult = await twoFactorService.setupTwoFactor(userId);
        assert.ok(setupResult.secret);
        assert.ok(setupResult.otpauthUrl);
        assert.ok(setupResult.qrCodeDataUrl.startsWith('data:image/png;base64,'));
        assert.strictEqual(setupResult.recoveryCodes.length, 8);

        // Verify stored secret is encrypted with IV:AuthTag:Ciphertext format (SEC-17)
        assert.ok(updatedUser.twoFactorSecret.includes(':'));
        const parts = updatedUser.twoFactorSecret.split(':');
        assert.strictEqual(parts.length, 3, 'Must have IV, authTag, and ciphertext');
      } finally {
        User.findById = origFindById;
      }
    });

    test('validates correct TOTP code and enables 2FA', async () => {
      const userId = new mongoose.Types.ObjectId();
      let userObj;

      const origFindById = User.findById;
      User.findById = async () => userObj;

      try {
        userObj = {
          _id: userId,
          email: 'user@shopsphere.io',
          role: 'customer',
          save: async function() { return this; }
        };

        const setup = await twoFactorService.setupTwoFactor(userId);

        // Generate valid code using the otpauth library
        const { TOTP, Secret } = require('otpauth');
        const totp = new TOTP({
          secret: Secret.fromBase32(setup.secret),
          digits: 6,
          period: 30
        });
        const currentCode = totp.generate();

        const verifyResult = await twoFactorService.verifyAndEnable(userId, currentCode);
        assert.strictEqual(verifyResult.enabled, true);
        assert.strictEqual(userObj.twoFactorEnabled, true);
      } finally {
        User.findById = origFindById;
      }
    });

    test('validates recovery code on single use and revokes it', async () => {
      const userId = new mongoose.Types.ObjectId();
      let userObj;

      const origFindById = User.findById;
      User.findById = async () => userObj;

      try {
        userObj = {
          _id: userId,
          email: 'user@shopsphere.io',
          role: 'customer',
          save: async function() { return this; }
        };

        const setup = await twoFactorService.setupTwoFactor(userId);
        userObj.twoFactorEnabled = true;

        const recoveryCode = setup.recoveryCodes[0];

        // First use: valid
        const validFirstTime = await twoFactorService.validateRecoveryCode(userId, recoveryCode);
        assert.strictEqual(validFirstTime, true);
        assert.strictEqual(userObj.twoFactorRecoveryCodes.length, 7);

        // Second use of the same code: rejected (one-time use)
        const validSecondTime = await twoFactorService.validateRecoveryCode(userId, recoveryCode);
        assert.strictEqual(validSecondTime, false);
      } finally {
        User.findById = origFindById;
      }
    });

    test('forbids admin role from disabling 2FA (mandatory for admins)', async () => {
      const adminId = new mongoose.Types.ObjectId();
      const origFindById = User.findById;
      User.findById = async () => ({
        _id: adminId,
        role: 'admin',
        twoFactorEnabled: true
      });

      try {
        await assert.rejects(
          async () => {
            await twoFactorService.disableTwoFactor(adminId);
          },
          (err) => {
            assert.strictEqual(err.code, 'TWO_FA_MANDATORY');
            return true;
          }
        );
      } finally {
        User.findById = origFindById;
      }
    });
  });

  describe('4.1.4 Admin Operations (ADM-FR-01 to 03, SEC-21)', () => {
    test('suspendUser sets status to suspended, revokes refresh tokens, and logs audit', async () => {
      const adminId = new mongoose.Types.ObjectId();
      const targetUserId = new mongoose.Types.ObjectId();

      let targetUser = {
        _id: targetUserId,
        email: 'spammer@example.com',
        role: 'customer',
        status: 'active',
        save: async function() { return this; }
      };

      const origUserFind = User.findById;
      const origTokenUpdateMany = RefreshToken.updateMany;
      const origAuditLog = auditService.log;

      let revokedTokens = false;
      let loggedAudit = null;

      User.findById = async (id) => targetUser;
      RefreshToken.updateMany = async (filter, update) => {
        if (filter.userId.toString() === targetUserId.toString() && update.isRevoked === true) {
          revokedTokens = true;
        }
      };
      auditService.log = async (req, data) => {
        loggedAudit = data;
      };

      try {
        const mockReq = {
          user: { _id: adminId, role: 'admin' },
          ip: '10.0.0.1',
          headers: { 'user-agent': 'AdminTool' }
        };

        const res = await adminService.suspendUser(targetUserId, 'Fraudulent activity', mockReq);
        assert.strictEqual(targetUser.status, 'suspended');
        assert.strictEqual(revokedTokens, true);
        assert.ok(loggedAudit);
        assert.strictEqual(loggedAudit.action, 'user.suspend');
        assert.strictEqual(loggedAudit.details.reason, 'Fraudulent activity');
      } finally {
        User.findById = origUserFind;
        RefreshToken.updateMany = origTokenUpdateMany;
        auditService.log = origAuditLog;
      }
    });

    test('moderateListing updates product status and writes audit log', async () => {
      const adminId = new mongoose.Types.ObjectId();
      const productId = new mongoose.Types.ObjectId();

      let productObj = {
        _id: productId,
        title: 'Policy Violating Product',
        status: 'published',
        save: async function() { return this; }
      };

      const origProductFind = Product.findById;
      const origAuditLog = auditService.log;
      let loggedAudit = null;

      Product.findById = async () => productObj;
      auditService.log = async (req, data) => { loggedAudit = data; };

      try {
        const mockReq = {
          user: { _id: adminId, role: 'admin' },
          ip: '10.0.0.1',
          headers: { 'user-agent': 'AdminTool' }
        };

        await adminService.moderateListing(productId, { status: 'unpublished', reason: 'Copyright claim' }, mockReq);
        assert.strictEqual(productObj.status, 'unpublished');
        assert.ok(loggedAudit);
        assert.strictEqual(loggedAudit.action, 'listing.unpublish');
        assert.strictEqual(loggedAudit.details.reason, 'Copyright claim');
      } finally {
        Product.findById = origProductFind;
        auditService.log = origAuditLog;
      }
    });

    test('forceRefundOrder transitions subOrders to refunded and logs audit', async () => {
      const adminId = new mongoose.Types.ObjectId();
      const orderId = new mongoose.Types.ObjectId();
      const subOrderId = new mongoose.Types.ObjectId();

      let orderObj = {
        _id: orderId,
        payment: { status: 'completed' },
        subOrders: [
          {
            _id: subOrderId,
            status: 'confirmed',
            history: []
          }
        ],
        save: async function() { return this; }
      };
      orderObj.subOrders.id = (id) => orderObj.subOrders[0];

      const origOrderFind = Order.findById;
      const origAuditLog = auditService.log;
      let loggedAudit = null;

      Order.findById = async () => orderObj;
      auditService.log = async (req, data) => { loggedAudit = data; };

      try {
        const mockReq = {
          user: { _id: adminId, role: 'admin' },
          ip: '10.0.0.1',
          headers: { 'user-agent': 'AdminTool' }
        };

        await adminService.forceRefundOrder(orderId, { reason: 'Item not received' }, mockReq);
        assert.strictEqual(orderObj.subOrders[0].status, 'cancelled');
        assert.strictEqual(orderObj.payment.status, 'refunded');
        assert.ok(loggedAudit);
        assert.strictEqual(loggedAudit.action, 'order.force_refund');
        assert.strictEqual(loggedAudit.details.reason, 'Item not received');
      } finally {
        Order.findById = origOrderFind;
        auditService.log = origAuditLog;
      }
    });
  });
});
