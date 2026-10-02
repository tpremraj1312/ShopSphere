const { test, describe } = require('node:test');
const assert = require('node:assert');
const { validateImageMagicBytes, getPresignedUploadUrl } = require('../../src/shared/upload');

describe('Image Upload Validation & Pre-signed URL (SEC-10)', () => {
  test('validates correct PNG magic bytes', () => {
    // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00]);
    const isValid = validateImageMagicBytes(pngBuffer, 'image/png');
    assert.strictEqual(isValid, true);
  });

  test('validates correct JPEG magic bytes', () => {
    // JPEG magic bytes: FF D8 FF
    const jpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]);
    const isValid = validateImageMagicBytes(jpegBuffer, 'image/jpeg');
    assert.strictEqual(isValid, true);
  });

  test('rejects spoofed file (e.g. text file renamed to .png)', () => {
    const textBuffer = Buffer.from('This is a text file not an image!');
    assert.throws(
      () => {
        validateImageMagicBytes(textBuffer, 'image/png');
      },
      (err) => {
        assert.strictEqual(err.statusCode, 400);
        assert.strictEqual(err.code, 'MALICIOUS_FILE_DETECTED');
        return true;
      }
    );
  });

  test('rejects unsupported MIME type (e.g. application/exe)', () => {
    const buffer = Buffer.from([0x4D, 0x5A]); // MZ header
    assert.throws(
      () => {
        validateImageMagicBytes(buffer, 'application/x-msdownload');
      },
      (err) => {
        assert.strictEqual(err.statusCode, 400);
        assert.strictEqual(err.code, 'INVALID_FILE_TYPE');
        return true;
      }
    );
  });

  test('generates pre-signed URL with key and sanitized name', async () => {
    const result = await getPresignedUploadUrl('My Cool Product image #1.png', 'image/png');
    assert.ok(result.uploadUrl);
    assert.ok(result.publicUrl);
    assert.ok(result.key.startsWith('products/'));
    assert.ok(!result.key.includes(' '));
  });
});
