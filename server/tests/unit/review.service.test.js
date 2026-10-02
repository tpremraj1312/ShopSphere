const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const reviewService = require('../../src/modules/reviews/review.service');
const Review = require('../../src/modules/reviews/review.model');
const Product = require('../../src/modules/products/product.model');
const Order = require('../../src/modules/orders/order.model');

describe('Review Service — Verified Purchase, CRUD, Voting & Seller Response (Step 3.2, REV-FR-01 to 05)', () => {
  const customerId = new mongoose.Types.ObjectId();
  const otherCustomerId = new mongoose.Types.ObjectId();
  const sellerId = new mongoose.Types.ObjectId();
  const productId = new mongoose.Types.ObjectId();
  const orderId = new mongoose.Types.ObjectId();
  const reviewId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    Product.findById = async () => null;
    Product.findOne = async () => null;
    Product.findByIdAndUpdate = async () => null;
    Order.findOne = async () => null;
    Review.findById = async () => null;
    Review.findOne = async () => null;
    Review.findOneAndDelete = async () => null;
    Review.create = async (doc) => ({ _id: new mongoose.Types.ObjectId(), ...doc });
    Review.aggregate = async () => [{ _id: null, avgRating: 4.5, count: 2 }];
    Review.countDocuments = async () => 0;
    Review.find = () => ({
      sort: () => ({
        skip: () => ({
          limit: () => ({
            populate: () => ({
              lean: async () => []
            })
          })
        })
      })
    });
  });

  describe('createReview (REV-FR-01, Step 3.2.2)', () => {
    test('rejects if product does not exist', async () => {
      Product.findById = () => ({ lean: async () => null });

      await assert.rejects(
        async () => {
          await reviewService.createReview(customerId, {
            productId,
            orderId,
            rating: 5,
            body: 'Great product'
          });
        },
        (err) => {
          assert.strictEqual(err.statusCode, 404);
          assert.strictEqual(err.code, 'PRODUCT_NOT_FOUND');
          return true;
        }
      );
    });

    test('rejects if order does not belong to customer or is not found', async () => {
      Product.findById = () => ({ lean: async () => ({ _id: productId, title: 'Test Product' }) });
      Order.findOne = () => ({ lean: async () => null });

      await assert.rejects(
        async () => {
          await reviewService.createReview(customerId, {
            productId,
            orderId,
            rating: 5,
            body: 'Great product'
          });
        },
        (err) => {
          assert.strictEqual(err.statusCode, 403);
          assert.strictEqual(err.code, 'ORDER_NOT_FOUND');
          return true;
        }
      );
    });

    test('rejects if order is not delivered for this product (REV-FR-01 gate)', async () => {
      Product.findById = () => ({ lean: async () => ({ _id: productId, title: 'Test Product' }) });
      Order.findOne = () => ({
        lean: async () => ({
          _id: orderId,
          customerId,
          subOrders: [
            {
              sellerId,
              status: 'shipped', // Not delivered yet
              items: [{ productId }]
            }
          ]
        })
      });

      await assert.rejects(
        async () => {
          await reviewService.createReview(customerId, {
            productId,
            orderId,
            rating: 5,
            body: 'Great product'
          });
        },
        (err) => {
          assert.strictEqual(err.statusCode, 403);
          assert.strictEqual(err.code, 'NOT_DELIVERED');
          return true;
        }
      );
    });

    test('rejects duplicate review for the same product and order', async () => {
      Product.findById = () => ({ lean: async () => ({ _id: productId, title: 'Test Product' }) });
      Order.findOne = () => ({
        lean: async () => ({
          _id: orderId,
          customerId,
          subOrders: [
            {
              sellerId,
              status: 'delivered',
              items: [{ productId }]
            }
          ]
        })
      });
      Review.findOne = async () => ({ _id: reviewId });

      await assert.rejects(
        async () => {
          await reviewService.createReview(customerId, {
            productId,
            orderId,
            rating: 5,
            body: 'Great product'
          });
        },
        (err) => {
          assert.strictEqual(err.statusCode, 409);
          assert.strictEqual(err.code, 'DUPLICATE_REVIEW');
          return true;
        }
      );
    });

    test('creates review and recomputes product rating when verified', async () => {
      Product.findById = () => ({ lean: async () => ({ _id: productId, title: 'Test Product' }) });
      Order.findOne = () => ({
        lean: async () => ({
          _id: orderId,
          customerId,
          subOrders: [
            {
              sellerId,
              status: 'delivered',
              items: [{ productId }]
            }
          ]
        })
      });
      Review.findOne = async () => null;

      let recomputed = false;
      Product.findByIdAndUpdate = async (pId, update) => {
        if (pId.toString() === productId.toString()) {
          recomputed = true;
          assert.strictEqual(update.ratingAvg, 4.5);
          assert.strictEqual(update.ratingCount, 2);
        }
      };

      const result = await reviewService.createReview(customerId, {
        productId,
        orderId,
        rating: 5,
        title: 'Outstanding quality',
        body: 'Exceeded expectations in every way.'
      });

      assert.strictEqual(result.rating, 5);
      assert.strictEqual(result.title, 'Outstanding quality');
      assert.strictEqual(result.isVerifiedPurchase, true);
      assert.strictEqual(recomputed, true);
    });
  });

  describe('updateReview & deleteReview (REV-FR-01)', () => {
    test('updateReview updates fields if caller is owner', async () => {
      const mockReview = {
        _id: reviewId,
        customerId,
        productId,
        rating: 4,
        title: 'Initial',
        body: 'Initial body',
        save: async function () { return this; }
      };

      Review.findOne = async () => mockReview;

      const updated = await reviewService.updateReview(customerId, reviewId, {
        rating: 5,
        title: 'Updated title'
      });

      assert.strictEqual(updated.rating, 5);
      assert.strictEqual(updated.title, 'Updated title');
    });

    test('deleteReview deletes if caller is owner and recomputes rating', async () => {
      Review.findOneAndDelete = async () => ({ _id: reviewId, productId });
      let recomputed = false;
      Product.findByIdAndUpdate = async () => { recomputed = true; };

      const result = await reviewService.deleteReview(customerId, reviewId);
      assert.strictEqual(result.deleted, true);
      assert.strictEqual(recomputed, true);
    });
  });

  describe('voteReview (REV-FR-04, Step 3.2.5)', () => {
    test('rejects self-voting', async () => {
      const mockReview = {
        _id: reviewId,
        customerId,
        helpfulVotes: 0,
        unhelpfulVotes: 0,
        voters: []
      };
      Review.findById = async () => mockReview;

      await assert.rejects(
        async () => {
          await reviewService.voteReview(customerId, reviewId, 'helpful');
        },
        (err) => {
          assert.strictEqual(err.statusCode, 400);
          assert.strictEqual(err.code, 'SELF_VOTE');
          return true;
        }
      );
    });

    test('adds vote and toggles off on repeat vote', async () => {
      const mockReview = {
        _id: reviewId,
        customerId: otherCustomerId,
        helpfulVotes: 0,
        unhelpfulVotes: 0,
        voters: [],
        save: async function () { return this; }
      };
      Review.findById = async () => mockReview;

      // 1. Initial helpful vote
      const res1 = await reviewService.voteReview(customerId, reviewId, 'helpful');
      assert.strictEqual(res1.helpfulVotes, 1);
      assert.strictEqual(mockReview.voters.length, 1);

      // 2. Repeat identical vote should undo / toggle off
      const res2 = await reviewService.voteReview(customerId, reviewId, 'helpful');
      assert.strictEqual(res2.helpfulVotes, 0);
      assert.strictEqual(mockReview.voters.length, 0);
    });

    test('switches vote from helpful to unhelpful', async () => {
      const mockReview = {
        _id: reviewId,
        customerId: otherCustomerId,
        helpfulVotes: 1,
        unhelpfulVotes: 0,
        voters: [{ userId: customerId, vote: 'helpful' }],
        save: async function () { return this; }
      };
      Review.findById = async () => mockReview;

      const res = await reviewService.voteReview(customerId, reviewId, 'unhelpful');
      assert.strictEqual(res.helpfulVotes, 0);
      assert.strictEqual(res.unhelpfulVotes, 1);
    });
  });

  describe('addSellerResponse (REV-FR-05, Step 3.2.5)', () => {
    test('rejects if seller does not own the product', async () => {
      Review.findById = async () => ({
        _id: reviewId,
        productId
      });
      Product.findOne = () => ({ lean: async () => null });

      await assert.rejects(
        async () => {
          await reviewService.addSellerResponse(sellerId, reviewId, 'Thanks for your feedback!');
        },
        (err) => {
          assert.strictEqual(err.statusCode, 403);
          assert.strictEqual(err.code, 'NOT_PRODUCT_OWNER');
          return true;
        }
      );
    });

    test('attaches seller response if caller owns the product', async () => {
      const mockReview = {
        _id: reviewId,
        productId,
        sellerResponse: null,
        save: async function () { return this; }
      };
      Review.findById = async () => mockReview;
      Product.findOne = () => ({ lean: async () => ({ _id: productId, sellerId }) });

      const updated = await reviewService.addSellerResponse(
        sellerId,
        reviewId,
        'Thank you so much! We take pride in quality.'
      );

      assert.strictEqual(updated.sellerResponse.body, 'Thank you so much! We take pride in quality.');
      assert.ok(updated.sellerResponse.respondedAt instanceof Date);
    });
  });
});
