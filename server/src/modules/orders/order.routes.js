const express = require('express');
const router = express.Router();
const orderController = require('./order.controller');
const requireAuth = require('../../middleware/auth');
const requireRole = require('../../middleware/rbac');
const validate = require('../../middleware/validate');
const {
  checkoutSchema,
  updateSubOrderStatusSchema,
  orderQuerySchema
} = require('./order.validation');

/**
 * Order Routes
 *
 * All order routes require authentication.
 * Checkout creates an order from the user's cart.
 */

// ──────────────────────────────────────────────────
// Checkout
// ──────────────────────────────────────────────────
router.post(
  '/checkout',
  requireAuth,
  validate(checkoutSchema),
  orderController.checkout.bind(orderController)
);

// ──────────────────────────────────────────────────
// Customer Order History (ORD-FR-01)
// ──────────────────────────────────────────────────
router.get(
  '/orders',
  requireAuth,
  validate(orderQuerySchema),
  orderController.getMyOrders.bind(orderController)
);

// ──────────────────────────────────────────────────
// Single Order Detail
// ──────────────────────────────────────────────────
router.get(
  '/orders/:id',
  requireAuth,
  orderController.getOrderById.bind(orderController)
);

// ──────────────────────────────────────────────────
// Customer Cancel Order (ORD-FR-04)
// ──────────────────────────────────────────────────
router.put(
  '/orders/:id/cancel',
  requireAuth,
  orderController.cancelOrder.bind(orderController)
);

// ──────────────────────────────────────────────────
// Cash on Delivery (COD) Confirmation
// ──────────────────────────────────────────────────
router.post(
  '/orders/:id/confirm-cod',
  requireAuth,
  orderController.confirmCodOrder.bind(orderController)
);

// ──────────────────────────────────────────────────
// Update Order Shipping Address during checkout/payment
// ──────────────────────────────────────────────────
router.put(
  '/orders/:id/shipping-address',
  requireAuth,
  orderController.updateShippingAddress.bind(orderController)
);

// ──────────────────────────────────────────────────
// Seller Order Management (ORD-FR-02)
// ──────────────────────────────────────────────────
router.get(
  '/seller/orders',
  requireAuth,
  requireRole('seller', 'admin'),
  validate(orderQuerySchema),
  orderController.getSellerOrders.bind(orderController)
);

router.put(
  '/seller/orders/:orderId/sub/:subOrderId/status',
  requireAuth,
  requireRole('seller', 'admin'),
  validate(updateSubOrderStatusSchema),
  orderController.updateSubOrderStatus.bind(orderController)
);

module.exports = router;
