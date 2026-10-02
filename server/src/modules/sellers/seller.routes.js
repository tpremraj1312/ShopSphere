const express = require('express');
const router = express.Router();
const sellerController = require('./seller.controller');
const requireAuth = require('../../middleware/auth');
const requireRole = require('../../middleware/rbac');
const validate = require('../../middleware/validate');
const {
  applySellerSchema,
  updateStockSchema,
  inventoryQuerySchema,
  analyticsQuerySchema,
  bulkUploadSchema,
  sellerPhoneOtpSchema,
  verifySellerPhoneSchema
} = require('./seller.validation');

/**
 * Seller Routes (SELL-FR-01 to 05, Phase 3.1)
 */

// 1. Seller Onboarding / Application (SELL-FR-01, Step 3.1.3)
router.post(
  '/apply',
  requireAuth,
  validate(applySellerSchema),
  sellerController.apply.bind(sellerController)
);

router.post('/phone-otp', requireAuth, validate(sellerPhoneOtpSchema), sellerController.requestPhoneOtp.bind(sellerController));
router.post('/phone-otp/verify', requireAuth, validate(verifySellerPhoneSchema), sellerController.verifyPhoneOtp.bind(sellerController));

// 2. Inventory Management (SELL-FR-03, Step 3.1.1)
router.get(
  '/inventory',
  requireAuth,
  requireRole('seller', 'admin'),
  validate(inventoryQuerySchema),
  sellerController.getInventory.bind(sellerController)
);

router.put(
  '/inventory/stock',
  requireAuth,
  requireRole('seller', 'admin'),
  validate(updateStockSchema),
  sellerController.updateStock.bind(sellerController)
);

// 3. Sales Analytics (SELL-FR-04, Step 3.1.2)
router.get(
  '/analytics',
  requireAuth,
  requireRole('seller', 'admin'),
  validate(analyticsQuerySchema),
  sellerController.getAnalytics.bind(sellerController)
);

// 4. CSV Bulk Upload (SELL-FR-05, Step 3.1.4)
router.post(
  '/products/bulk-csv',
  requireAuth,
  requireRole('seller', 'admin'),
  validate(bulkUploadSchema),
  sellerController.bulkUpload.bind(sellerController)
);

module.exports = router;
