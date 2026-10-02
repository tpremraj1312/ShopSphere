const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { escapeRegex, sanitizeMongoQuery } = require('../../src/shared/sanitize');

describe('Input Sanitization & Injection Defense (SEC-08, SEC-09)', () => {
  describe('escapeRegex', () => {
    it('escapes special regex characters to prevent ReDoS', () => {
      const malicious = '.*+?^${}()|[]\\';
      const escaped = escapeRegex(malicious);
      assert.strictEqual(escaped, '\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\');
    });

    it('returns empty string if non-string provided', () => {
      assert.strictEqual(escapeRegex(null), '');
      assert.strictEqual(escapeRegex(undefined), '');
      assert.strictEqual(escapeRegex(123), '');
    });

    it('preserves alphanumeric strings untouched', () => {
      assert.strictEqual(escapeRegex('iPhone 15 Pro Max'), 'iPhone 15 Pro Max');
    });
  });

  describe('sanitizeMongoQuery', () => {
    it('strips keys beginning with $ operator', () => {
      const payload = {
        name: 'test',
        $where: 'sleep(5000)',
        $gt: '',
        nested: {
          $ne: null,
          validKey: 'ok'
        }
      };
      const cleaned = sanitizeMongoQuery(payload);
      assert.deepStrictEqual(cleaned, {
        name: 'test',
        nested: {
          validKey: 'ok'
        }
      });
      assert.strictEqual(cleaned.$where, undefined);
      assert.strictEqual(cleaned.$gt, undefined);
      assert.strictEqual(cleaned.nested.$ne, undefined);
    });

    it('handles primitive values safely', () => {
      assert.strictEqual(sanitizeMongoQuery('test'), 'test');
      assert.strictEqual(sanitizeMongoQuery(null), null);
      assert.strictEqual(sanitizeMongoQuery(undefined), undefined);
    });
  });
});
