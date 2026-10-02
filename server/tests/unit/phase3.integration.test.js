const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');

const productService = require('../../src/modules/products/product.service');
const reviewService = require('../../src/modules/reviews/review.service');
const notificationService = require('../../src/modules/notifications/notification.service');
const orderEvents = require('../../src/modules/orders/orderEvents');
const emailProvider = require('../../src/shared/email');

const Product = require('../../src/modules/products/product.model');
const Order = require('../../src/modules/orders/order.model');
const Review = require('../../src/modules/reviews/review.model');
const Notification = require('../../src/modules/notifications/notification.model');
const User = require('../../src/modules/users/user.model');

describe('Phase 3 Exit Criteria — Full Marketplace E2E Journey Verification', () => {
  const sellerAId = new mongoose.Types.ObjectId();
  const sellerBId = new mongoose.Types.ObjectId();
  const customerId = new mongoose.Types.ObjectId();

  const prodAId = new mongoose.Types.ObjectId();
  const prodBId = new mongoose.Types.ObjectId();
  const orderId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    // Reset mocks
    User.findById = () => ({
      lean: async () => ({ _id: customerId, email: 'customer@marketplace.com' })
    });

    Notification.create = async (doc) => ({ _id: new mongoose.Types.ObjectId(), ...doc });
    Notification.find = () => ({
      sort: () => ({ skip: () => ({ limit: () => ({ lean: async () => [] }) }) })
    });
    Notification.countDocuments = async () => 0;
  });

  test('Complete Phase 3 Marketplace Loop: Search → Multi-Seller Order → Notification → Review → Seller Response', async () => {
    // 1. Cross-seller typo-tolerant search test
    const { buildTypoRegex } = require('../../src/modules/products/product.service');
    const wirlessRx = buildTypoRegex('wirless');
    const keyboerdRx = buildTypoRegex('keyboerd');
    assert.ok(wirlessRx.test('Mechanical Wireless Keyboard Pro'));
    assert.ok(keyboerdRx.test('Mechanical Wireless Keyboard Pro'));

    // 2. Multi-seller order with delivered sub-order
    const mockOrder = {
      _id: orderId,
      customerId,
      subOrders: [
        {
          _id: new mongoose.Types.ObjectId(),
          sellerId: sellerAId,
          status: 'delivered', // Delivered by Seller A
          items: [{ productId: prodAId, sku: 'KB-PRO-1', qty: 1, unitPrice: 99 }]
        },
        {
          _id: new mongoose.Types.ObjectId(),
          sellerId: sellerBId,
          status: 'shipped', // In-transit by Seller B
          items: [{ productId: prodBId, sku: 'MO-PRO-1', qty: 1, unitPrice: 49 }]
        }
      ]
    };

    Order.findOne = () => ({ lean: async () => mockOrder });
    Order.find = () => ({ lean: async () => [mockOrder] });

    // 3. Trigger order:shipped event and verify notification dispatch
    let shippedNotifCreated = false;
    Notification.create = async (doc) => {
      if (doc.type === 'order_shipped') shippedNotifCreated = true;
      return { _id: new mongoose.Types.ObjectId(), ...doc };
    };

    orderEvents.emit('order:shipped', {
      order: mockOrder,
      subOrder: mockOrder.subOrders[1],
      extras: { trackingNumber: 'TRK-998877' }
    });

    await new Promise((r) => setTimeout(r, 40));
    assert.strictEqual(shippedNotifCreated, true);

    // 4. Customer writes verified-purchase review for delivered item (prodAId)
    Product.findById = () => ({ lean: async () => ({ _id: prodAId, title: 'Wireless Keyboard' }) });
    Review.findOne = async () => null;
    let productRatingUpdated = false;
    Product.findByIdAndUpdate = async (id, update) => {
      productRatingUpdated = true;
      assert.strictEqual(update.ratingAvg, 5);
      assert.strictEqual(update.ratingCount, 1);
    };

    Review.aggregate = async () => [{ _id: null, avgRating: 5.0, count: 1 }];
    Review.create = async (doc) => ({ _id: new mongoose.Types.ObjectId(), ...doc });

    const review = await reviewService.createReview(customerId, {
      productId: prodAId,
      orderId,
      rating: 5,
      title: 'Amazing keyboard!',
      body: 'Quiet switches and stellar battery life.'
    });

    assert.strictEqual(review.rating, 5);
    assert.strictEqual(review.isVerifiedPurchase, true);
    assert.strictEqual(productRatingUpdated, true);

    // 5. Customer attempts to review undelivered item (prodBId) -> Rejected by gate (REV-FR-01)
    await assert.rejects(
      async () => {
        await reviewService.createReview(customerId, {
          productId: prodBId,
          orderId,
          rating: 4,
          body: 'Not yet delivered review'
        });
      },
      (err) => {
        assert.strictEqual(err.statusCode, 403);
        assert.strictEqual(err.code, 'NOT_DELIVERED');
        return true;
      }
    );

    // 6. Seller A responds to the review on their product (REV-FR-05)
    Review.findById = async () => ({
      _id: review._id,
      productId: prodAId,
      sellerResponse: null,
      save: async function () { return this; }
    });
    Product.findOne = () => ({ lean: async () => ({ _id: prodAId, sellerId: sellerAId }) });

    const respondedReview = await reviewService.addSellerResponse(
      sellerAId,
      review._id,
      'Thank you! Glad you enjoy the quiet switches!'
    );

    assert.strictEqual(respondedReview.sellerResponse.body, 'Thank you! Glad you enjoy the quiet switches!');

    // 7. Seller B attempts to respond to Seller A's product review -> Rejected (SEC-04)
    Product.findOne = () => ({ lean: async () => null });
    await assert.rejects(
      async () => {
        await reviewService.addSellerResponse(sellerBId, review._id, 'Unauthorized response');
      },
      (err) => {
        assert.strictEqual(err.statusCode, 403);
        assert.strictEqual(err.code, 'NOT_PRODUCT_OWNER');
        return true;
      }
    );
  });
});
