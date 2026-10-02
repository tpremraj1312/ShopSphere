const orderService = require('./order.service');
const { sendSuccess, sendError } = require('../../shared/response');

/**
 * OrderController — request/response transformation only.
 * All business logic lives in OrderService.
 */
class OrderController {
  /**
   * POST /api/v1/checkout — Create order from cart
   */
  async checkout(req, res, next) {
    try {
      const order = await orderService.createOrder(req.user._id, req.body);
      return sendSuccess(res, order, null, 201);
    } catch (error) {
      console.error('[CHECKOUT_ERROR]', JSON.stringify({
        userId: req.user?._id?.toString(),
        paymentMethod: req.body?.paymentMethod,
        idempotencyKey: req.body?.idempotencyKey,
        code: error.code,
        message: error.message,
        stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
      }));
      next(error);
    }
  }

  /**
   * GET /api/v1/orders — Customer's order history (ORD-FR-01)
   */
  async getMyOrders(req, res, next) {
    try {
      const { page, limit, status } = req.query;
      const result = await orderService.getCustomerOrders(req.user._id, {
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        status
      });
      return sendSuccess(res, result.orders, { pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/orders/:id — Single order detail
   */
  async getOrderById(req, res, next) {
    try {
      const order = await orderService.getOrderById(
        req.params.id,
        req.user._id,
        req.user.role
      );
      return sendSuccess(res, order);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/seller/orders — Seller's orders (ORD-FR-02)
   */
  async getSellerOrders(req, res, next) {
    try {
      const { page, limit, status } = req.query;
      const result = await orderService.getSellerOrders(req.user._id, {
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        status
      });
      return sendSuccess(res, result.orders, { pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/seller/orders/:orderId/sub/:subOrderId/status
   * Seller updates sub-order status (pack, ship, deliver)
   */
  async updateSubOrderStatus(req, res, next) {
    try {
      const { orderId, subOrderId } = req.params;
      const { status, trackingNumber, carrier, reason } = req.body;
      const order = await orderService.updateSubOrderStatus(
        orderId,
        subOrderId,
        status,
        { userId: req.user._id, role: req.user.role },
        { trackingNumber, carrier, reason }
      );
      return sendSuccess(res, order);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/orders/:id/cancel — Customer cancels order (ORD-FR-04)
   * Cancels all sub-orders that are still in a cancellable state
   */
  async cancelOrder(req, res, next) {
    try {
      const order = await orderService.getOrderById(
        req.params.id,
        req.user._id,
        req.user.role
      );

      const { reason } = req.body || {};
      let cancelled = 0;

      for (const subOrder of order.subOrders) {
        if (['pending', 'confirmed'].includes(subOrder.status)) {
          await orderService.updateSubOrderStatus(
            order._id,
            subOrder._id,
            'cancelled',
            { userId: req.user._id, role: 'customer' },
            { reason: reason || 'Customer requested cancellation' }
          );
          cancelled++;
        }
      }

      // Re-fetch the updated order
      const updatedOrder = await orderService.getOrderById(
        req.params.id,
        req.user._id,
        req.user.role
      );

      return sendSuccess(res, {
        order: updatedOrder,
        cancelledSubOrders: cancelled
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/orders/:id/confirm-cod — Confirm order with Cash on Delivery
   */
  async confirmCodOrder(req, res, next) {
    try {
      const order = await orderService.confirmCodOrder(req.params.id, req.user._id);
      return sendSuccess(res, order);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/orders/:id/shipping-address — Update order shipping address during checkout
   */
  async updateShippingAddress(req, res, next) {
    try {
      const order = await orderService.updateShippingAddress(
        req.params.id,
        req.user._id,
        req.body
      );
      return sendSuccess(res, order);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OrderController();
