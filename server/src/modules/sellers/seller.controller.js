const sellerService = require('./seller.service');
const { sendSuccess } = require('../../shared/response');

class SellerController {
  async requestPhoneOtp(req, res, next) {
    try {
      const result = await sellerService.requestPhoneOtp(req.user._id, req.body.phone);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async verifyPhoneOtp(req, res, next) {
    try {
      const result = await sellerService.verifyPhoneOtp(req.user._id, req.body.otp);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/sellers/apply
   * Customer applies for seller status (SELL-FR-01, Step 3.1.3)
   */
  async apply(req, res, next) {
    try {
      const result = await sellerService.applyForSeller(req.user._id, req.body);
      return sendSuccess(res, result, null, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/seller/inventory
   * List inventory with low-stock flags and metrics (SELL-FR-03, Step 3.1.1)
   */
  async getInventory(req, res, next) {
    try {
      const result = await sellerService.getInventory(req.user._id, req.query);
      return sendSuccess(res, result.items, {
        metrics: result.metrics,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/seller/inventory/stock
   * Update SKU stock count with ownership check (SELL-FR-03, SEC-04)
   */
  async updateStock(req, res, next) {
    try {
      const result = await sellerService.updateSkuStock(req.user._id, req.body);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/seller/analytics
   * Revenue, units sold, top products, and daily order trends (SELL-FR-04, Step 3.1.2)
   */
  async getAnalytics(req, res, next) {
    try {
      const result = await sellerService.getAnalytics(req.user._id, req.query);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/seller/products/bulk-csv
   * Bulk upload products via CSV text/file (SELL-FR-05, Step 3.1.4)
   */
  async bulkUpload(req, res, next) {
    try {
      const result = await sellerService.bulkUploadCsv(req.user._id, req.body.csvData);
      return sendSuccess(res, result, null, 201);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SellerController();
