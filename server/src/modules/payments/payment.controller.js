const paymentService = require('./payment.service');
const { sendSuccess } = require('../../shared/response');

class PaymentController {
  /**
   * POST /api/v1/payments/create-intent
   */
  async createIntent(req, res, next) {
    try {
      const result = await paymentService.createPaymentIntent(
        req.user._id,
        req.body.orderId
      );
      return sendSuccess(res, result, null, 201);
    } catch (error) {
      console.error('[PAYMENT_INTENT_ERROR]', JSON.stringify({
        userId: req.user?._id?.toString(),
        orderId: req.body?.orderId,
        code: error.code,
        message: error.message,
        stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
      }));
      next(error);
    }
  }

  /**
   * POST /api/v1/payments/verify
   * Called by the browser after the Razorpay modal succeeds.
   * Verifies the payment signature server-side and confirms the order.
   */
  async verifyPayment(req, res, next) {
    try {
      const result = await paymentService.verifyPayment(req.user._id, req.body);
      return sendSuccess(res, result);
    } catch (error) {
      console.error('[PAYMENT_VERIFY_ERROR]', JSON.stringify({
        userId: req.user?._id?.toString(),
        orderId: req.body?.orderId,
        code: error.code,
        message: error.message
      }));
      next(error);
    }
  }

  /**
   * POST /api/v1/payments/webhook
   * Optional Razorpay webhook (requires RAZORPAY_WEBHOOK_SECRET).
   * Needs the raw request body, see express.json({ verify }) in app.js.
   */
  async handleWebhook(req, res, next) {
    try {
      const signature = req.headers['x-razorpay-signature'];
      const result = await paymentService.handleWebhook(req.rawBody, signature);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/payments/:orderId/refund
   * Admin/Seller initiated refund
   */
  async processRefund(req, res, next) {
    try {
      const result = await paymentService.processRefund(
        req.params.orderId,
        req.body,
        { userId: req.user._id, role: req.user.role }
      );
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/payments/:orderId/status
   * Polling endpoint for client checkout flow
   */
  async getStatus(req, res, next) {
    try {
      const result = await paymentService.getPaymentStatus(
        req.params.orderId,
        req.user._id
      );
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PaymentController();