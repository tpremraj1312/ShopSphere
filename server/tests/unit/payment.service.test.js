const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const paymentService = require('../../src/modules/payments/payment.service');
const Order = require('../../src/modules/orders/order.model');
const AuditLog = require('../../src/modules/audit/auditLog.model');
const orderService = require('../../src/modules/orders/order.service');

describe('Payment Service & Webhook Confirmation (PAY-FR-01 to 05, SEC-18)', () => {
  beforeEach(() => {
    Order.findById = async () => null;
    Order.prototype.save = async function () { return this; };
    AuditLog.create = async () => ({ _id: 'audit123' });
  });

  it('createPaymentIntent rejects when user is not the order owner', async () => {
    Order.findById = async () => ({
      _id: 'order123',
      customerId: 'other_user',
      pricing: { total: 100 },
      payment: { status: 'pending' }
    });

    await assert.rejects(
      async () => {
        await paymentService.createPaymentIntent('user123', 'order123');
      },
      (err) => {
        assert.strictEqual(err.code, 'FORBIDDEN');
        assert.strictEqual(err.statusCode, 403);
        return true;
      }
    );
  });

  it('createPaymentIntent creates sandbox intent with clientSecret and stores providerPaymentId', async () => {
    let savedOrder;
    const mockOrder = {
      _id: 'order123',
      customerId: 'user123',
      pricing: { total: 199.99 },
      payment: { status: 'pending' },
      save: async function () {
        savedOrder = this;
        return this;
      }
    };
    Order.findById = async () => mockOrder;

    const result = await paymentService.createPaymentIntent('user123', 'order123');

    assert.ok(result.clientSecret);
    assert.ok(result.paymentIntentId);
    assert.strictEqual(result.amount, 199.99);
    assert.strictEqual(mockOrder.payment.providerPaymentId, result.paymentIntentId);
  });

  it('webhook payment_intent.succeeded is the ONLY route to confirm order (PAY-FR-02)', async () => {
    let confirmedOrder = null;
    orderService.confirmOrderPayment = async (orderId, paymentData) => {
      confirmedOrder = { orderId, paymentData };
      return confirmedOrder;
    };

    const webhookPayload = {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_test_12345',
          metadata: { orderId: 'order_abc_123' },
          payment_method_types: ['card']
        }
      }
    };

    const result = await paymentService.handleWebhook(webhookPayload, 'sig_mock');
    assert.strictEqual(result.received, true);
    assert.ok(confirmedOrder);
    assert.strictEqual(confirmedOrder.orderId, 'order_abc_123');
    assert.strictEqual(confirmedOrder.paymentData.providerPaymentId, 'pi_test_12345');
  });

  it('processRefund updates order payment status and logs to AuditLog (PAY-FR-05, SEC-13)', async () => {
    let auditEntry = null;
    AuditLog.create = async (entry) => {
      auditEntry = entry;
      return entry;
    };

    const mockOrder = {
      _id: 'order_to_refund',
      pricing: { total: 150 },
      payment: { status: 'completed', providerPaymentId: 'pi_123' },
      save: async function () { return this; }
    };
    Order.findById = async () => mockOrder;

    const result = await paymentService.processRefund(
      'order_to_refund',
      { amount: 150, reason: 'Defective item' },
      { userId: 'admin_user', role: 'admin' }
    );

    assert.strictEqual(result.status, 'refunded');
    assert.strictEqual(mockOrder.payment.status, 'refunded');
    assert.ok(auditEntry);
    assert.strictEqual(auditEntry.action, 'PAYMENT_REFUND');
    assert.strictEqual(auditEntry.actorRole, 'admin');
    assert.strictEqual(auditEntry.details.refundAmount, 150);
  });
});
