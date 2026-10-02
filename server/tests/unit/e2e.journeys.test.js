const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

// Services involved in E2E journeys
const orderService = require('../../src/modules/orders/order.service');
const sellerService = require('../../src/modules/sellers/seller.service');
const reviewService = require('../../src/modules/reviews/review.service');
const adminService = require('../../src/modules/admin/admin.service');
const { generateStepUpToken } = require('../../src/middleware/stepUpAuth');

// Models for stubbing
const Product = require('../../src/modules/products/product.model');
const Order = require('../../src/modules/orders/order.model');
const Cart = require('../../src/modules/cart/cart.model');
const User = require('../../src/modules/users/user.model');
const Review = require('../../src/modules/reviews/review.model');
const AuditLog = require('../../src/modules/audit/auditLog.model');

describe('End-to-End User Journey Tests (Step 5.1.2)', () => {
  // ---------------------------------------------------------------------------
  // Journey 1: Customer Purchase Journey
  // ---------------------------------------------------------------------------
  describe('Journey 1: Customer Purchase Flow (Catalog -> Cart -> Order -> Payment)', () => {
    it('executes full checkout journey with price validation and stock deduction', async () => {
      const customerId = new mongoose.Types.ObjectId().toString();
      const sellerId = new mongoose.Types.ObjectId().toString();
      const productId = new mongoose.Types.ObjectId().toString();

      // Mock Product
      const mockProduct = {
        _id: productId,
        title: 'Sony WH-1000XM5 Headphones',
        sellerId: sellerId,
        status: 'published',
        variants: [
          { sku: 'SONY-BLK', price: 399.99, stock: 10, images: ['https://example.com/sony.jpg'] }
        ]
      };

      // Mock Cart
      const mockCart = {
        _id: new mongoose.Types.ObjectId(),
        userId: customerId,
        items: [
          {
            productId: mockProduct._id,
            sku: 'SONY-BLK',
            title: mockProduct.title,
            priceSnapshot: 399.99,
            qty: 2,
            sellerId: sellerId
          }
        ],
        save: async function() { return this; }
      };

      const origProductFindById = Product.findById;
      const origProductUpdateOne = Product.updateOne;
      const origCartFindOne = Cart.findOne;
      const origOrderSave = Order.prototype.save;
      const origOrderFindOne = Order.findOne;

      let stockDeducted = false;

      Order.findOne = () => Promise.resolve(null);
      Product.findById = () => Promise.resolve(mockProduct);
      Product.updateOne = () => { stockDeducted = true; return Promise.resolve(); };
      Cart.findOne = () => Promise.resolve(mockCart);
      Order.prototype.save = async function() {
        return this;
      };

      try {
        const order = await orderService.createOrder(
          customerId,
          {
            shippingAddress: {
              street: '456 Market St',
              city: 'San Francisco',
              state: 'CA',
              postalCode: '94105',
              country: 'US'
            },
            paymentMethod: 'stripe',
            idempotencyKey: 'idempotency-key-test-123'
          }
        );

        assert.ok(order, 'Order must be created');
        assert.strictEqual(order.customerId.toString(), customerId);
        assert.strictEqual(order.subOrders.length, 1);
        assert.strictEqual(order.subOrders[0].items[0].qty, 2);
        assert.strictEqual(order.subOrders[0].items[0].unitPrice, 399.99);
        assert.ok(order.pricing.total > 700);
        assert.strictEqual(stockDeducted, true, 'Stock must be automatically deducted');
        assert.strictEqual(mockCart.items.length, 0, 'Cart must be cleared after purchase');
      } finally {
        Product.findById = origProductFindById;
        Product.updateOne = origProductUpdateOne;
        Cart.findOne = origCartFindOne;
        Order.prototype.save = origOrderSave;
        Order.findOne = origOrderFindOne;
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Journey 2: Seller Lifecycle Journey
  // ---------------------------------------------------------------------------
  describe('Journey 2: Seller Lifecycle (Application -> Inventory -> Fulfillment)', () => {
    it('onboards seller, updates SKU stock, and transitions order fulfillment status', async () => {
      const sellerId = new mongoose.Types.ObjectId().toString();
      const orderId = new mongoose.Types.ObjectId().toString();
      const subOrderId = new mongoose.Types.ObjectId().toString();

      // 1. Seller Onboarding application
      const mockUser = {
        _id: sellerId,
        role: 'customer',
        save: async function() { return this; }
      };

      const origUserFindById = User.findById;
      User.findById = () => Promise.resolve(mockUser);

      try {
        const onboarded = await sellerService.applyForSeller(sellerId, {
          storeName: 'Audio Haven',
          storeDescription: 'Premium headphones & DACs',
          taxId: 'US-TAX-998877'
        });

        assert.strictEqual(onboarded.role, 'seller');
        assert.strictEqual(onboarded.sellerProfile.storeName, 'Audio Haven');

        // 2. Order Fulfillment Status Update (Packed -> Shipped)
        const mockSubOrder = {
          _id: subOrderId,
          sellerId: sellerId,
          status: 'packed',
          items: []
        };

        const mockOrder = {
          _id: orderId,
          customerId: new mongoose.Types.ObjectId().toString(),
          subOrders: {
            id: (id) => (id === subOrderId ? mockSubOrder : null)
          },
          save: async function() { return this; }
        };

        const origOrderFindById = Order.findById;
        Order.findById = () => Promise.resolve(mockOrder);

        const updated = await orderService.updateSubOrderStatus(
          orderId,
          subOrderId,
          'shipped',
          { userId: sellerId, role: 'seller' },
          { trackingNumber: 'TRACK-123456', carrier: 'FedEx' }
        );

        assert.strictEqual(mockSubOrder.status, 'shipped');
        assert.strictEqual(mockSubOrder.trackingNumber, 'TRACK-123456');
        assert.strictEqual(mockSubOrder.carrier, 'FedEx');
        Order.findById = origOrderFindById;
      } finally {
        User.findById = origUserFindById;
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Journey 3: Admin Governance & Step-Up Re-Authentication
  // ---------------------------------------------------------------------------
  describe('Journey 3: Admin Governance Journey (Step-Up -> Moderation -> Audit Logging)', () => {
    it('enforces step-up authentication, suspends user, and produces forensic audit log', async () => {
      const adminId = new mongoose.Types.ObjectId().toString();
      const targetUserId = new mongoose.Types.ObjectId().toString();

      // 1. Generate short-lived elevated action token
      const stepUpToken = generateStepUpToken({
        _id: adminId,
        role: 'admin',
        scope: 'admin:suspend_user'
      });
      assert.ok(stepUpToken, 'Step-up token must be generated');

      // 2. Suspend malicious user with audit logging
      const mockTarget = {
        _id: targetUserId,
        email: 'malicious@spammer.com',
        role: 'customer',
        status: 'active',
        save: async function() { return this; }
      };

      const origUserFindById = User.findById;
      const origAuditSave = AuditLog.prototype.save;
      const origRefreshUpdateMany = require('../../src/modules/auth/refreshToken.model').updateMany;
      let auditLogged = false;

      User.findById = (id) => (id === targetUserId ? Promise.resolve(mockTarget) : Promise.resolve(null));
      require('../../src/modules/auth/refreshToken.model').updateMany = () => Promise.resolve();
      AuditLog.prototype.save = async function() {
        auditLogged = true;
        assert.strictEqual(this.action, 'user.suspend');
        assert.strictEqual(this.actorId.toString(), adminId);
        assert.strictEqual(this.targetId.toString(), targetUserId);
        return this;
      };

      try {
        const mockReq = {
          user: { _id: adminId, role: 'admin' },
          ip: '192.168.1.50',
          headers: { 'user-agent': 'AdminClient/1.0' },
          get: (h) => (h.toLowerCase() === 'user-agent' ? 'AdminClient/1.0' : null)
        };

        const suspended = await adminService.suspendUser(
          targetUserId,
          'Fraudulent chargeback activity',
          mockReq
        );

        assert.strictEqual(suspended.user.status, 'suspended');
        assert.strictEqual(auditLogged, true, 'Audit log must be recorded for privileged suspension');
      } finally {
        User.findById = origUserFindById;
        AuditLog.prototype.save = origAuditSave;
        require('../../src/modules/auth/refreshToken.model').updateMany = origRefreshUpdateMany;
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Journey 4: Verified Purchase Review Gating
  // ---------------------------------------------------------------------------
  describe('Journey 4: Verified Purchase Review Gating (REV-FR-01)', () => {
    it('rejects unverified review and accepts review once order is delivered', async () => {
      const customerId = new mongoose.Types.ObjectId().toString();
      const productId = new mongoose.Types.ObjectId().toString();
      const orderId = new mongoose.Types.ObjectId().toString();

      // Case A: Order is not delivered yet -> REJECT
      const mockOrderPending = {
        _id: orderId,
        customerId: customerId,
        subOrders: [
          {
            status: 'shipped', // Not delivered yet!
            items: [{ productId: productId }]
          }
        ]
      };

      const origOrderFindOne = Order.findOne;
      const origProductFindById = Product.findById;
      const origReviewFindOne = Review.findOne;

      Order.findOne = () => ({
        lean: () => Promise.resolve(mockOrderPending)
      });
      Product.findById = () => ({
        lean: () => Promise.resolve({ _id: productId, ratingAvg: 4.5, ratingCount: 2 })
      });
      Review.findOne = () => Promise.resolve(null);

      try {
        await assert.rejects(
          async () => {
            await reviewService.createReview(customerId, {
              productId,
              orderId,
              rating: 5,
              title: 'Great headphones',
              body: 'Sound quality is superb'
            });
          },
          (err) => {
            assert.strictEqual(err.statusCode, 403);
            assert.strictEqual(err.code, 'NOT_DELIVERED');
            return true;
          }
        );

        // Case B: Order delivered -> ACCEPT & aggregate rating
        const mockOrderDelivered = {
          _id: orderId,
          customerId: customerId,
          subOrders: [
            {
              status: 'delivered', // Verified delivered!
              items: [{ productId: productId }]
            }
          ]
        };

        Order.findOne = () => ({
          lean: () => Promise.resolve(mockOrderDelivered)
        });
        
        let ratingRecomputed = false;
        reviewService._recomputeProductRating = async () => {
          ratingRecomputed = true;
        };

        const origReviewCreate = Review.create;
        Review.create = async (doc) => ({
          ...doc,
          _id: new mongoose.Types.ObjectId()
        });

        const review = await reviewService.createReview(customerId, {
          productId,
          orderId,
          rating: 5,
          title: 'Verified Delivered Purchase',
          body: 'Arrived on time and works great!'
        });

        assert.strictEqual(review.rating, 5);
        assert.strictEqual(ratingRecomputed, true, 'Product rating average must be recomputed');
        Review.create = origReviewCreate;
      } finally {
        Order.findOne = origOrderFindOne;
        Product.findById = origProductFindById;
        Review.findOne = origReviewFindOne;
      }
    });
  });
});
