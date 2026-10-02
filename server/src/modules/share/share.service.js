const crypto = require('crypto');
const ShortUrl = require('./shortUrl.model');

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

function generateShortCode(length = 6) {
  const bytes = crypto.randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return code;
}

class ShareService {
  async shortenUrl({ originalUrl, productId, title, baseUrl }) {
    if (!originalUrl || typeof originalUrl !== 'string') {
      const err = new Error('Original URL is required');
      err.statusCode = 400;
      throw err;
    }

    const cleanOriginalUrl = originalUrl.trim();

    // Check if an active short URL already exists for this productId or URL
    let existing;
    if (productId) {
      existing = await ShortUrl.findOne({ productId }).lean();
    } else {
      existing = await ShortUrl.findOne({ originalUrl: cleanOriginalUrl }).lean();
    }

    const clientBase = (baseUrl || process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');

    if (existing) {
      return {
        shortCode: existing.shortCode,
        shortUrl: `${clientBase}/s/${existing.shortCode}`,
        originalUrl: existing.originalUrl,
        title: existing.title,
        clicks: existing.clicks,
      };
    }

    // Generate unique short code
    let shortCode = generateShortCode(6);
    let attempts = 0;
    while ((await ShortUrl.exists({ shortCode })) && attempts < 5) {
      shortCode = generateShortCode(6);
      attempts++;
    }

    const created = await ShortUrl.create({
      shortCode,
      originalUrl: cleanOriginalUrl,
      title: title || 'ShopSphere Product',
      productId: productId || undefined,
    });

    return {
      shortCode: created.shortCode,
      shortUrl: `${clientBase}/s/${created.shortCode}`,
      originalUrl: created.originalUrl,
      title: created.title,
      clicks: created.clicks,
    };
  }

  async resolveShortCode(code) {
    if (!code) {
      const err = new Error('Short code is required');
      err.statusCode = 400;
      throw err;
    }

    const shortUrl = await ShortUrl.findOneAndUpdate(
      { shortCode: code.trim() },
      { $inc: { clicks: 1 } },
      { new: true }
    );

    if (!shortUrl) {
      const err = new Error('Short link not found or expired');
      err.statusCode = 404;
      throw err;
    }

    return shortUrl;
  }
}

module.exports = new ShareService();
