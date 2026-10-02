const shareService = require('./share.service');
const { sendSuccess } = require('../../shared/response');

class ShareController {
  async shorten(req, res, next) {
    try {
      const { originalUrl, productId, title } = req.body;
      const baseUrl = req.headers.origin || process.env.CLIENT_URL || 'http://localhost:5173';
      const result = await shareService.shortenUrl({ originalUrl, productId, title, baseUrl });
      return sendSuccess(res, result, null, 201);
    } catch (error) {
      next(error);
    }
  }

  async resolve(req, res, next) {
    try {
      const { code } = req.params;
      const shortUrl = await shareService.resolveShortCode(code);

      // If caller requests JSON or Accept header is application/json
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return sendSuccess(res, shortUrl);
      }

      // Otherwise redirect to originalUrl
      return res.redirect(302, shortUrl.originalUrl);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ShareController();
