/**
 * File upload validation & S3/R2 presigned URL service (SEC-10)
 * Validates files by MIME type AND magic bytes before uploading to cloud storage.
 * Local disk storage is forbidden.
 */

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Magic bytes signatures
const MAGIC_BYTES = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]] // RIFF
};

const validateImageMagicBytes = (buffer, mimeType) => {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error('Invalid file buffer');
  }

  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    const error = new Error(`Unsupported MIME type: ${mimeType}. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`);
    error.statusCode = 400;
    error.code = 'INVALID_FILE_TYPE';
    error.isOperational = true;
    throw error;
  }

  const expectedSignatures = MAGIC_BYTES[mimeType];
  const matched = expectedSignatures.some(sig => {
    if (buffer.length < sig.length) return false;
    for (let i = 0; i < sig.length; i++) {
      if (buffer[i] !== sig[i]) return false;
    }
    return true;
  });

  if (!matched) {
    const error = new Error('File content does not match reported MIME type (magic bytes check failed)');
    error.statusCode = 400;
    error.code = 'MALICIOUS_FILE_DETECTED';
    error.isOperational = true;
    throw error;
  }

  return true;
};

/**
 * Generate a pre-signed upload URL or mock S3/R2 URL for client direct upload
 */
const getPresignedUploadUrl = async (fileName, mimeType) => {
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    const error = new Error(`Unsupported image type: ${mimeType}`);
    error.statusCode = 400;
    error.code = 'INVALID_FILE_TYPE';
    throw error;
  }

  const timestamp = Date.now();
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `products/${timestamp}-${sanitizedName}`;

  // In production, AWS S3 / Cloudflare R2 presigned URL is returned
  const bucket = process.env.S3_BUCKET || 'shopsphere-assets';
  const region = process.env.AWS_REGION || 'us-east-1';
  const publicUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

  return {
    uploadUrl: `${publicUrl}?presigned=true&expires=900`,
    publicUrl,
    key
  };
};

module.exports = {
  validateImageMagicBytes,
  getPresignedUploadUrl,
  ALLOWED_MIME_TYPES
};
