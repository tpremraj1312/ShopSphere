const express = require('express');
const router = express.Router();
const cartController = require('./cart.controller');
const requireAuth = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const {
  addToCartSchema,
  updateCartItemSchema,
  removeCartItemSchema,
  mergeCartSchema
} = require('./cart.validation');

// Cart CRUD routes (CART-FR-01, Step 2.4.2)
router.get('/', requireAuth, cartController.getCart);
router.post('/', requireAuth, validate(addToCartSchema), cartController.addItem);
router.put('/:itemId', requireAuth, validate(updateCartItemSchema), cartController.updateItem);
router.delete('/:itemId', requireAuth, validate(removeCartItemSchema), cartController.removeItem);
router.delete('/', requireAuth, cartController.clearCart);

// Cart merge on login (Step 2.4.3)
router.post('/merge', requireAuth, validate(mergeCartSchema), cartController.mergeCart);

module.exports = router;
