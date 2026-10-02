const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const orderService = require('../../src/modules/orders/order.service');
const Order = require('../../src/modules/orders/order.model');
const Cart = require('../../src/modules/cart/cart.model');
const Product = require('../../src/modules/products/product.model');

describe('Order Service — Checkout, Revalidation, Idempotency & SubOrders (Phase 2.5 & 2.7)', () => {
  beforeEach(() => {
    // Reset mocks
    Order.findOne = async () => null;
    Order.prototype.save = async function () { return this; };
    Product.updateOne = async () => ({ modifiedCount: 1 });
  });

  it('idempotencyKey returns existing order on duplicate submit (CART-FR-06)', async () => {
    const existingOrder = { _id: 'order_dup_123', idempotencyKey: 'idem-uuid-001' };
    Order.findOne = async (query) => {
      if (query.idempotencyKey === 'idem-uuid-001') return existingOrder;
      return null;
    };

    const result = await orderService.createOrder('user123', {
      idempotencyKey: 'idem-uuid-001'
    });

    assert.strictEqual(result._id, 'order_dup_123');
  });

  it('rejects checkout when cart is empty', async () => {
    Cart.findOne = async () => ({ items: [] });

    await assert.rejects(
      async () => {
        await orderService.createOrder('user123', { idempotencyKey: 'idem-uuid-empty' });
      },
      (err) => {
        assert.strictEqual(err.code, 'EMPTY_CART');
        assert.strictEqual(err.statusCode, 400);
        return true;
      }
    );
  });

  it('revalidates stock and rejects if cart item quantity exceeds live variant stock', async () => {
    Cart.findOne = async () => ({
      items: [{
        productId: 'prod1',
        sku: 'SKU-RED-M',
        title: 'Running Shoes',
        qty: 5,
        priceSnapshot: 100
      }],
      save: async () => {}
    });

    Product.findById = async () => ({
      _id: 'prod1',
      title: 'Running Shoes',
      status: 'published',
      variants: [{ sku: 'SKU-RED-M', stock: 2, price: 100 }]
    });

    await assert.rejects(
      async () => {
        await orderService.createOrder('user123', {
          idempotencyKey: 'idem-uuid-stock',
          shippingAddress: { street: '123 Test', city: 'Metropolis', state: 'NY', postalCode: '10001', country: 'US' }
        });
      },
      (err) => {
        assert.strictEqual(err.code, 'INSUFFICIENT_STOCK');
        assert.strictEqual(err.statusCode, 400);
        return true;
      }
    );
  });

  it('groups items into subOrders by sellerId and applies server-side pricing and discount', async () => {
    Cart.findOne = async () => ({
      items: [
        { productId: 'prod1', sku: 'SKU-A1', title: 'Product 1', qty: 2, priceSnapshot: 50 },
        { productId: 'prod2', sku: 'SKU-B1', title: 'Product 2', qty: 1, priceSnapshot: 300 }
      ],
      save: async function () { this.items = []; }
    });

    const sellerAId = '507f1f77bcf86cd799439011';
    const sellerBId = '507f1f77bcf86cd799439012';

    Product.findById = async (id) => {
      if (id === 'prod1') {
        return {
          _id: 'prod1',
          sellerId: sellerAId,
          title: 'Product 1',
          status: 'published',
          variants: [{ sku: 'SKU-A1', stock: 10, price: 100 }] // live price is 100, not cart's 50
        };
      }
      if (id === 'prod2') {
        return {
          _id: 'prod2',
          sellerId: sellerBId,
          title: 'Product 2',
          status: 'published',
          variants: [{ sku: 'SKU-B1', stock: 10, price: 300 }]
        };
      }
      return null;
    };

    let savedOrder;
    Order.prototype.save = async function () {
      savedOrder = this;
      return this;
    };

    const order = await orderService.createOrder('507f1f77bcf86cd799439010', {
      idempotencyKey: 'idem-uuid-multi-seller',
      couponCode: 'WELCOME10',
      shippingAddress: { fullName: 'John Doe', phone: '1234567890', addressLine1: '123 Test', city: 'Metropolis', state: 'NY', postalCode: '10001', country: 'US' }
    });

    // Subtotal: (2 * 100) + (1 * 300) = 500
    // Tax: 18% of 500 = 90
    // Shipping: free over 500 = 0
    // Coupon WELCOME10: 10% of 500 = 50
    // Total: 500 + 90 + 0 - 50 = 540
    assert.strictEqual(order.subOrders.length, 2, 'Should create 2 subOrders for 2 different sellers');
    assert.strictEqual(order.pricing.subtotal, 500);
    assert.strictEqual(order.pricing.tax, 90);
    assert.strictEqual(order.pricing.discount, 50);
    assert.strictEqual(order.pricing.total, 540);

    // Verify sub-orders belong to respective sellers
    const alphaSub = order.subOrders.find(s => s.sellerId && s.sellerId.toString() === sellerAId);
    const betaSub = order.subOrders.find(s => s.sellerId && s.sellerId.toString() === sellerBId);
    assert.ok(alphaSub, 'Should find seller A suborder');
    assert.ok(betaSub, 'Should find seller B suborder');
    assert.strictEqual(alphaSub.items.length, 1);
    assert.strictEqual(alphaSub.items[0].unitPrice, 100, 'Used live price, not client price');
  });

  it('rejects invalid or expired coupon codes', () => {
    assert.throws(
      () => orderService._validateCoupon('FAKECOUPON', 500),
      /Invalid coupon code/
    );

    assert.throws(
      () => orderService._validateCoupon('SAVE20', 100), // Min cart is 500
      /Minimum cart value/
    );
  });
});
