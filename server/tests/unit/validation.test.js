const { test, describe } = require('node:test');
const assert = require('node:assert');
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} = require('../../src/modules/users/user.validation');

describe('User Validation Schemas (Zod)', () => {
  test('registerSchema rejects invalid email', () => {
    const result = registerSchema.safeParse({
      body: { email: 'not-an-email', password: 'securepassword123' }
    });
    assert.strictEqual(result.success, false);
  });

  test('registerSchema rejects short password (< 8 chars)', () => {
    const result = registerSchema.safeParse({
      body: { email: 'user@example.com', password: '123' }
    });
    assert.strictEqual(result.success, false);
  });

  test('registerSchema accepts valid registration payload', () => {
    const result = registerSchema.safeParse({
      body: { email: 'user@example.com', password: 'securepassword123' }
    });
    assert.strictEqual(result.success, true);
  });

  test('loginSchema rejects invalid email', () => {
    const result = loginSchema.safeParse({
      body: { email: 'invalid', password: 'pass' }
    });
    assert.strictEqual(result.success, false);
  });

  test('loginSchema rejects empty password', () => {
    const result = loginSchema.safeParse({
      body: { email: 'user@example.com', password: '' }
    });
    assert.strictEqual(result.success, false);
  });

  test('resetPasswordSchema requires token and minimum 8 char password', () => {
    const invalid = resetPasswordSchema.safeParse({
      body: { token: '', password: 'short' }
    });
    assert.strictEqual(invalid.success, false);

    const valid = resetPasswordSchema.safeParse({
      body: { token: 'validtoken123', password: 'newpassword123' }
    });
    assert.strictEqual(valid.success, true);
  });
});
