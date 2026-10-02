const { test, describe } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const RefreshToken = require('../../src/modules/auth/refreshToken.model');

describe('RefreshToken Model Schema', () => {
  test('validates required fields: userId, token, expiresAt, familyId', async () => {
    const tokenRecord = new RefreshToken({});
    let validationError = null;
    try {
      await tokenRecord.validate();
    } catch (err) {
      validationError = err;
    }

    assert.ok(validationError);
    assert.ok(validationError.errors['userId']);
    assert.ok(validationError.errors['token']);
    assert.ok(validationError.errors['expiresAt']);
    assert.ok(validationError.errors['familyId']);
  });

  test('sets isRevoked default to false', async () => {
    const tokenRecord = new RefreshToken({
      userId: new mongoose.Types.ObjectId(),
      token: 'some_refresh_token_string',
      expiresAt: new Date(Date.now() + 10000),
      familyId: 'family_1234'
    });

    assert.strictEqual(tokenRecord.isRevoked, false);
    await tokenRecord.validate();
  });
});
