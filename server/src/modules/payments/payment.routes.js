const express = require('express');
const router = express.Router();
const paymentController = require('./payment.controller');
const requireAuth = require('../../middleware/auth');
const requireRole = require('../../middleware/rbac');
const validate = require('../../middleware/validate');
const {
  createIntentSchema,
  verifyPaymentSchema,
  refundSchema,
  paymentStatusSchema
} = require('./payment.validation');

/**
 * Payment Routes (PAY-FR-01 to 05, Step 2.6) - Razorpay
 */

// 1. Create Razorpay order (client initiates checkout payment)
router.post(
  '/create-intent',
  requireAuth,
  validate(createIntentSchema),
  paymentController.createIntent.bind(paymentController)
);

// 2. Verify payment after the Razorpay modal succeeds (works on localhost)
router.post(
  '/verify',
  requireAuth,
  validate(verifyPaymentSchema),
  paymentController.verifyPayment.bind(paymentController)
);

// 3. Razorpay webhook (optional, signature-verified, no auth middleware
//    because it is called directly by Razorpay servers)
router.post(
  '/webhook',
  paymentController.handleWebhook.bind(paymentController)
);

// 4. Process refund (admin or seller only)
router.post(
  '/:orderId/refund',
  requireAuth,
  requireRole('admin', 'seller'),
  validate(refundSchema),
  paymentController.processRefund.bind(paymentController)
);

// 5. Polling endpoint for checkout payment confirmation
router.get(
  '/:orderId/status',
  requireAuth,
  validate(paymentStatusSchema),
  paymentController.getStatus.bind(paymentController)
);

module.exports = router;