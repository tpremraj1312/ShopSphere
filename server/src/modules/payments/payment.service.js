const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../orders/order.model');
const orderService = require('../orders/order.service');
const AuditLog = require('../audit/auditLog.model');

// SEC-18 AUDIT COMPLIANCE:
// ShopSphere never receives, logs, or stores raw credit card numbers.
// Payment processing uses Razorpay Hosted Checkout / Orders API exclusively.

// Razorpay accounts default to INR. Change this only if international
// payments are enabled on your Razorpay account.
const PAYMENT_CURRENCY = 'INR';

function httpError(message, statusCode, code) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a || ''));
  const bufB = Buffer.from(String(b || ''));
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

class PaymentService {
  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID;
    this.keySecret = process.env.RAZORPAY_KEY_SECRET;
    // OPTIONAL: only needed if you set up webhooks in the Razorpay dashboard.
    // Not required for the checkout flow in test mode (see verifyPayment).
    this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    this.isLive = Boolean(
      this.keyId &&
      this.keySecret &&
      !this.keyId.startsWith('mock_') &&
      !this.keyId.includes('placeholder')
    );

    this.razorpay = this.isLive
      ? new Razorpay({ key_id: this.keyId, key_secret: this.keySecret })
      : null;

    this.hasWebhookSecret = Boolean(
      this.webhookSecret && !this.webhookSecret.includes('placeholder')
    );
  }

  /**
   * Create a Razorpay Order for checkout (PAY-FR-01, PAY-FR-02)
   */
  async createPaymentIntent(userId, orderId) {
    console.info('[PAYMENT_INTENT_REQUEST]', JSON.stringify({ userId: userId?.toString(), orderId }));
    const order = await Order.findById(orderId);
    if (!order) {
      throw httpError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    if (order.customerId.toString() !== userId.toString()) {
      throw httpError('Unauthorized access to order', 403, 'FORBIDDEN');
    }

    if (order.payment.status === 'completed') {
      throw httpError('Order has already been paid for', 400, 'ORDER_ALREADY_PAID');
    }

    // Smallest currency unit (paise)
    const amountInSubunits = Math.round(order.pricing.total * 100);
    const currency = PAYMENT_CURRENCY;

    // Razorpay test/live credentials are configured
    if (this.razorpay) {
      try {
        const razorpayOrder = await this.razorpay.orders.create({
          amount: amountInSubunits,
          currency,
          receipt: `rcpt_${order._id.toString().substring(0, 10)}`,
          notes: {
            orderId: order._id.toString(),
            customerId: userId.toString()
          }
        });

        order.payment.providerPaymentId = razorpayOrder.id;
        order.payment.provider = 'razorpay';
        await order.save();

        return {
          keyId: this.keyId,
          orderId: razorpayOrder.id,
          paymentIntentId: razorpayOrder.id,
          amount: order.pricing.total,
          currency,
          provider: 'razorpay'
        };
      } catch (err) {
        console.error('[RAZORPAY_ORDER_CREATE_FAILED]', JSON.stringify({
          orderId,
          userId: userId?.toString(),
          message: err.message,
          statusCode: err.statusCode,
          description: err.error?.description
        }));
        throw httpError(
          `Razorpay gateway error: ${err.error?.description || err.message}`,
          502,
          'PAYMENT_GATEWAY_ERROR'
        );
      }
    }

    // Sandbox / mock fallback when Razorpay keys are not configured (dev only)
    const mockOrderId = `order_rzp_mock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    console.warn('[PAYMENT_SANDBOX_FALLBACK]', JSON.stringify({ orderId, userId: userId?.toString(), reason: 'Razorpay credentials are not configured' }));

    order.payment.providerPaymentId = mockOrderId;
    order.payment.provider = 'razorpay_sandbox';
    await order.save();

    return {
      keyId: 'rzp_test_placeholder',
      orderId: mockOrderId,
      paymentIntentId: mockOrderId,
      clientSecret: mockOrderId,
      amount: order.pricing.total,
      currency,
      provider: 'razorpay_sandbox',
      isSandbox: true
    };
  }

  /**
   * Verify a payment after the Razorpay modal succeeds.
   * The browser sends razorpay_order_id, razorpay_payment_id and
   * razorpay_signature; we recompute HMAC_SHA256(order_id|payment_id, KEY_SECRET).
   * This works on localhost and needs NO webhook secret.
   */
  async verifyPayment(userId, body) {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    const order = await Order.findById(orderId);
    if (!order) {
      throw httpError('Order not found', 404, 'ORDER_NOT_FOUND');
    }
    if (order.customerId.toString() !== userId.toString()) {
      throw httpError('Unauthorized', 403, 'FORBIDDEN');
    }
    if (order.payment.status === 'completed') {
      return { verified: true, alreadyPaid: true };
    }

    const isSandbox = order.payment.provider === 'razorpay_sandbox';

    if (isSandbox) {
      // Mock payments are only allowed when Razorpay keys are not configured
      // and never in production.
      if (process.env.NODE_ENV === 'production' || this.razorpay) {
        throw httpError('Sandbox payments are disabled', 400, 'SANDBOX_DISABLED');
      }
    } else {
      if (!this.keySecret) {
        throw httpError('Razorpay is not configured', 500, 'PAYMENT_NOT_CONFIGURED');
      }
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        throw httpError('Missing payment verification fields', 400, 'MISSING_PAYMENT_FIELDS');
      }
      if (order.payment.providerPaymentId !== razorpay_order_id) {
        throw httpError('Razorpay order does not match this order', 400, 'ORDER_MISMATCH');
      }

      const expected = crypto
        .createHmac('sha256', this.keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (!safeEqual(expected, razorpay_signature)) {
        throw httpError('Invalid payment signature', 400, 'INVALID_PAYMENT_SIGNATURE');
      }
    }

    await orderService.confirmOrderPayment(orderId, {
      providerPaymentId: razorpay_payment_id || `pay_sandbox_${Date.now()}`,
      provider: isSandbox ? 'razorpay_sandbox' : 'razorpay',
      method: 'razorpay'
    });

    return { verified: true };
  }

  /**
   * Handle incoming webhook from Razorpay (PAY-FR-02, PAY-FR-03, PAY-FR-04)
   * OPTIONAL backup path. Without RAZORPAY_WEBHOOK_SECRET the webhook is
   * rejected, because unsigned webhooks could be forged by anyone.
   */
  async handleWebhook(rawBody, signature) {
    if (!this.hasWebhookSecret) {
      throw httpError(
        'Webhook is not configured. Payments are confirmed via /payments/verify.',
        503,
        'WEBHOOK_NOT_CONFIGURED'
      );
    }

    if (typeof rawBody !== 'string') {
      throw httpError('Raw webhook body is unavailable', 400, 'INVALID_WEBHOOK_PAYLOAD');
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (!signature || !safeEqual(expectedSignature, signature)) {
      throw httpError('Invalid Razorpay webhook signature', 400, 'INVALID_WEBHOOK_SIGNATURE');
    }

    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (err) {
      throw httpError('Malformed webhook payload', 400, 'INVALID_WEBHOOK_PAYLOAD');
    }

    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity || {};
    const orderEntity = payload.payload?.order?.entity || {};

    if (event === 'payment.captured' || event === 'order.paid') {
      const orderId = paymentEntity.notes?.orderId || orderEntity.notes?.orderId;

      if (!orderId) {
        throw httpError('Missing orderId in webhook notes', 400, 'MISSING_ORDER_METADATA');
      }

      await orderService.confirmOrderPayment(orderId, {
        providerPaymentId: paymentEntity.id || `pay_${Date.now()}`,
        provider: 'razorpay',
        method: paymentEntity.method || 'upi'
      });
    }

    if (event === 'payment.failed') {
      const orderId = paymentEntity.notes?.orderId;
      if (orderId) {
        const order = await Order.findById(orderId);
        if (order && order.payment.status !== 'completed') {
          order.payment.status = 'failed';
          await order.save();
        }
      }
    }

    return { received: true, provider: 'razorpay' };
  }

  /**
   * Process refund for an order via Razorpay (PAY-FR-05)
   * Logged to AuditLog (SEC-13)
   */
  async processRefund(orderId, refundData, actor) {
    const { amount, reason } = refundData;
    const order = await Order.findById(orderId);
    if (!order) {
      throw httpError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    if (order.payment.status !== 'completed') {
      throw httpError('Cannot refund an unpaid order', 400, 'ORDER_NOT_PAID');
    }

    const refundAmount = amount || order.pricing.total;
    let providerRefundId = `rfnd_mock_${Date.now()}`;

    // order.payment.providerPaymentId holds the Razorpay payment id (pay_...)
    // after confirmOrderPayment runs; mock/sandbox ids are skipped.
    const paymentId = order.payment.providerPaymentId;
    const isRealPayment =
      order.payment.provider === 'razorpay' &&
      Boolean(paymentId) &&
      !paymentId.startsWith('pay_sandbox_');

    if (this.razorpay && isRealPayment) {
      if (!paymentId.startsWith('pay_')) {
        throw httpError(
          'Razorpay payment id missing on this order; cannot refund',
          400,
          'PAYMENT_ID_MISSING'
        );
      }
      try {
        const refund = await this.razorpay.payments.refund(paymentId, {
          amount: Math.round(refundAmount * 100),
          notes: {
            reason: reason || 'Customer refund',
            orderId: order._id.toString()
          }
        });
        providerRefundId = refund.id;
      } catch (err) {
        throw httpError(
          `Razorpay refund failed: ${err.error?.description || err.message}`,
          502,
          'REFUND_GATEWAY_ERROR'
        );
      }
    }

    order.payment.status = refundAmount >= order.pricing.total ? 'refunded' : 'partially_refunded';
    await order.save();

    await AuditLog.create({
      action: 'PAYMENT_REFUND',
      actorId: actor.userId,
      actorRole: actor.role,
      targetType: 'Order',
      targetId: order._id,
      details: {
        refundAmount,
        reason: reason || 'Merchant/Admin initiated refund',
        providerRefundId,
        providerPaymentId: order.payment.providerPaymentId,
        provider: 'razorpay'
      }
    });

    return {
      orderId: order._id,
      refundId: providerRefundId,
      refundAmount,
      status: order.payment.status,
      provider: 'razorpay'
    };
  }

  /**
   * Get payment status for client polling (PAY-FR-04)
   */
  async getPaymentStatus(orderId, userId) {
    const order = await Order.findById(orderId).select('payment pricing customerId subOrders');
    if (!order) {
      throw httpError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    if (order.customerId.toString() !== userId.toString()) {
      throw httpError('Unauthorized', 403, 'FORBIDDEN');
    }

    const subOrders = order.subOrders || [];

    return {
      orderId: order._id,
      paymentStatus: order.payment.status,
      // Array.every() on an empty array is true, so guard against that.
      overallStatus:
        subOrders.length > 0 && subOrders.every((s) => s.status === 'confirmed')
          ? 'confirmed'
          : 'pending',
      amount: order.pricing.total,
      provider: order.payment.provider || 'razorpay'
    };
  }
}

module.exports = new PaymentService();