const { test, describe } = require('node:test');
const assert = require('node:assert');
const { sendSuccess, sendError } = require('../../src/shared/response');

describe('Shared Response Envelope', () => {
  test('sendSuccess sends correct success payload with status code 200', () => {
    let capturedStatus;
    let capturedJson;

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

    sendSuccess(res, { foo: 'bar' }, { page: 1 }, 200);

    assert.strictEqual(capturedStatus, 200);
    assert.strictEqual(capturedJson.success, true);
    assert.deepStrictEqual(capturedJson.data, { foo: 'bar' });
    assert.deepStrictEqual(capturedJson.meta, { page: 1 });
  });

  test('sendError sends standard error payload with status code', () => {
    let capturedStatus;
    let capturedJson;

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

    sendError(res, { code: 'NOT_FOUND', message: 'Item missing' }, 404);

    assert.strictEqual(capturedStatus, 404);
    assert.strictEqual(capturedJson.success, false);
    assert.strictEqual(capturedJson.error.code, 'NOT_FOUND');
    assert.strictEqual(capturedJson.error.message, 'Item missing');
  });
});
