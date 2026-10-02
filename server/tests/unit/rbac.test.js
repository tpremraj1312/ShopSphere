const { test, describe } = require('node:test');
const assert = require('node:assert');
const requireRole = require('../../src/middleware/rbac');

describe('RBAC Middleware', () => {
  test('returns 401 if req.user is undefined', () => {
    const middleware = requireRole('seller', 'admin');
    let capturedStatus;
    let capturedJson;

    const req = {};
    const res = {
      status: (code) => {
        capturedStatus = code;
        return res;
      },
      json: (data) => {
        capturedJson = data;
        return res;
      }
    };
    let nextCalled = false;

    middleware(req, res, () => { nextCalled = true; });

    assert.strictEqual(capturedStatus, 401);
    assert.strictEqual(capturedJson.error.code, 'UNAUTHORIZED');
    assert.strictEqual(nextCalled, false);
  });

  test('returns 403 when user does not have required role', () => {
    const middleware = requireRole('admin');
    let capturedStatus;
    let capturedJson;

    const req = { user: { role: 'customer' } };
    const res = {
      status: (code) => {
        capturedStatus = code;
        return res;
      },
      json: (data) => {
        capturedJson = data;
        return res;
      }
    };
    let nextCalled = false;

    middleware(req, res, () => { nextCalled = true; });

    assert.strictEqual(capturedStatus, 403);
    assert.strictEqual(capturedJson.error.code, 'FORBIDDEN');
    assert.strictEqual(nextCalled, false);
  });

  test('calls next() when user has matching role', () => {
    const middleware = requireRole('seller', 'admin');
    let capturedStatus = null;

    const req = { user: { role: 'seller' } };
    const res = {
      status: (code) => {
        capturedStatus = code;
        return res;
      },
      json: () => res
    };
    let nextCalled = false;

    middleware(req, res, () => { nextCalled = true; });

    assert.strictEqual(capturedStatus, null);
    assert.strictEqual(nextCalled, true);
  });
});
