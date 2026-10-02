const { test, describe } = require('node:test');
const assert = require('node:assert');
const User = require('../../src/modules/users/user.model');

describe('User Mongoose Model (Schema Validation)', () => {
  test('rejects validation when email is missing', async () => {
    const user = new User({
      passwordHash: 'somehash'
    });

    let validationError = null;
    try {
      await user.validate();
    } catch (err) {
      validationError = err;
    }

    assert.ok(validationError);
    assert.ok(validationError.errors['email']);
  });

  test('applies schema defaults correctly', () => {
    const user = new User({
      email: 'customer@example.com',
      passwordHash: 'somehash'
    });

    assert.strictEqual(user.role, 'customer');
    assert.strictEqual(user.emailVerified, false);
    assert.strictEqual(user.status, 'active');
    assert.strictEqual(user.twoFactorEnabled, false);
  });

  test('rejects invalid role enum', async () => {
    const user = new User({
      email: 'customer@example.com',
      passwordHash: 'somehash',
      role: 'invalid_role_name'
    });

    let validationError = null;
    try {
      await user.validate();
    } catch (err) {
      validationError = err;
    }

    assert.ok(validationError);
    assert.ok(validationError.errors['role']);
  });

  test('accepts valid roles: customer, seller, admin, super_admin', async () => {
    const roles = ['customer', 'seller', 'admin', 'super_admin'];
    for (const role of roles) {
      const user = new User({
        email: `${role}@example.com`,
        passwordHash: 'somehash',
        role
      });
      await user.validate();
    }
  });
});
