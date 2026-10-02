const express = require('express');
const router = express.Router();
const productController = require('./product.controller');
const requireAuth = require('../../middleware/auth');
const requireRole = require('../../middleware/rbac');
const validate = require('../../middleware/validate');
const {
  createProductSchema,
  updateProductSchema,
  productIdParamSchema
} = require('./product.validation');

// Public catalog routes (2.2.1, 2.2.2, 3.3.3)
router.get('/', productController.listProducts);
router.get('/facets', productController.getFacets);
router.get('/categories', productController.getCategories);
router.get('/suggestions', productController.getSuggestions);

// Seller-specific routes (2.1.2) - MUST be declared before /:id param route
router.get('/seller/mine', requireAuth, requireRole('seller', 'admin'), productController.getSellerProducts);
router.post('/upload-url', requireAuth, requireRole('seller', 'admin'), productController.getUploadUrl);

// Public product comparison with AI (Phase 2 & 3)
router.post('/compare/ai', productController.compareWithAi);

// Public single product detail & Recommendations (3.3.4)
router.get('/:id/also-bought', validate(productIdParamSchema), productController.getAlsoBought);
router.get('/:id', validate(productIdParamSchema), productController.getProductById);


// Seller CRUD routes (2.1.2) - Protected by requireAuth + requireRole('seller')
router.post(
  '/',
  requireAuth,
  requireRole('seller', 'admin'),
  validate(createProductSchema),
  productController.createProduct
);

router.put(
  '/:id',
  requireAuth,
  requireRole('seller', 'admin'),
  validate(updateProductSchema),
  productController.updateProduct
);

router.delete(
  '/:id',
  requireAuth,
  requireRole('seller', 'admin'),
  validate(productIdParamSchema),
  productController.deleteProduct
);

module.exports = router;
