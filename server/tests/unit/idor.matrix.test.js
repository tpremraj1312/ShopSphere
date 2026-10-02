const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

// Services under IDOR matrix test
const productService = require('../../src/modules/products/product.service');
const orderService = require('../../src/modules/orders/order.service');
const reviewService = require('../../src/modules/reviews/review.service');
const cartService = require('../../src/modules/cart/cart.service');
const addressService = require('../../src/modules/users/address.service');

// Models for stubbing
const Product = require('../../src/modules/products/product.model');
const Order = require('../../src/modules/orders/order.model');
const Review = require('../../src/modules/reviews/review.model');
const Cart = require('../../src/modules/cart/cart.model');
const User = require('../../src/modules/users/user.model');

/**
 * SEC-04: IDOR (Insecure Direct Object Reference) Verification Matrix (Step 4.2.5)
 *
 * Verifies that for every resource type (product, order, review, cart, address),
 * User A cannot read, update, or delete User B's resource via direct ID manipulation.
 */
describe('IDOR & Ownership Protection Test Matrix (SEC-04, Step 4.2.5)', () => {
  const userA_Id = new mongoose.Types.ObjectId().toString();
  const userB_Id = new mongoose.Types.ObjectId().toString();

  // 1. PRODUCT IDOR MATRIX
  describe('Product Resource Ownership', () => {
    it('rejects Seller B updating Seller A\'s product', async () => {
      const productId = new mongoose.Types.ObjectId().toString();
      const origFindById = Product.findById;

      Product.findById = () => Promise.resolve({
        _id: productId,
        sellerId: userA_Id, // Owned by Seller A
        title: 'Product A',
        save: async function() { return this; }
      });

      try {
        await assert.rejects(
          async () => {
            // Seller B tries to update Seller A's product
            await productService.updateProduct(userB_Id, productId, { title: 'Tampered Title' });
          },
          (err) => {
            assert.strictEqual(err.statusCode, 403);
            assert.strictEqual(err.code, 'FORBIDDEN_OWNERSHIP');
            return true;
          },
          'Expected 403 Forbidden when Seller B attempts to update Seller A\'s product'
        );
      } finally {
        Product.findById = origFindById;
      }
    });

    it('rejects Seller B deleting Seller A\'s product', async () => {
      const productId = new mongoose.Types.ObjectId().toString();
      const origFindById = Product.findById;

      Product.findById = () => Promise.resolve({
        _id: productId,
        sellerId: userA_Id, // Owned by Seller A
        title: 'Product A'
      });

      try {
        await assert.rejects(
          async () => {
            // Seller B tries to delete Seller A's product
            await productService.deleteProduct(userB_Id, productId);
          },
          (err) => {
            assert.strictEqual(err.statusCode, 403);
            assert.strictEqual(err.code, 'FORBIDDEN_OWNERSHIP');
            return true;
          }
        );
      } finally {
        Product.findById = origFindById;
      }
    });
  });

  // 2. ORDER IDOR MATRIX
  describe('Order Resource Ownership', () => {
    it('rejects Customer B accessing Customer A\'s order details', async () => {
      const orderId = new mongoose.Types.ObjectId().toString();
      const origFindById = Order.findById;

      Order.findById = () => Promise.resolve({
        _id: orderId,
        customerId: userA_Id, // Belongs to Customer A
        subOrders: [],
        items: [],
        totalAmount: 100
      });

      try {
        await assert.rejects(
          async () => {
            // Customer B tries to view Customer A's order by ID
            await orderService.getOrderById(orderId, userB_Id, 'customer');
          },
          (err) => {
            assert.strictEqual(err.statusCode, 403);
            assert.strictEqual(err.code, 'FORBIDDEN');
            return true;
          },
          'Expected 403 Forbidden when Customer B attempts to inspect Customer A\'s order'
        );
      } finally {
        Order.findById = origFindById;
      }
    });

    it('rejects Customer B cancelling or modifying Customer A\'s sub-order', async () => {
      const orderId = new mongoose.Types.ObjectId().toString();
      const subOrderId = new mongoose.Types.ObjectId().toString();
      const origFindById = Order.findById;

      Order.findById = () => Promise.resolve({
        _id: orderId,
        customerId: userA_Id, // Belongs to Customer A
        subOrders: {
          id: (id) => (id === subOrderId ? {
            _id: subOrderId,
            sellerId: new mongoose.Types.ObjectId().toString(),
            status: 'pending'
          } : null)
        }
      });

      try {
        await assert.rejects(
          async () => {
            // Customer B attempts to cancel Customer A's sub-order
            await orderService.updateSubOrderStatus(
              orderId,
              subOrderId,
              'cancelled',
              { userId: userB_Id, role: 'customer' },
              { reason: 'Malicious cancellation' }
            );
          },
          (err) => {
            assert.strictEqual(err.statusCode, 403);
            assert.strictEqual(err.code, 'FORBIDDEN');
            return true;
          }
        );
      } finally {
        Order.findById = origFindById;
      }
    });
  });

  // 3. REVIEW IDOR MATRIX
  describe('Review Resource Ownership', () => {
    it('rejects User B editing User A\'s product review', async () => {
      const reviewId = new mongoose.Types.ObjectId().toString();
      const origFindOne = Review.findOne;

      // When queried with { _id: reviewId, customerId: userB_Id }, return null because userB is not author
      Review.findOne = (query) => {
        if (query.customerId && query.customerId.toString() !== userA_Id) {
          return Promise.resolve(null);
        }
        return Promise.resolve({
          _id: reviewId,
          customerId: userA_Id,
          save: async function() { return this; }
        });
      };

      try {
        await assert.rejects(
          async () => {
            // User B attempts to edit User A's review
            await reviewService.updateReview(userB_Id, reviewId, { comment: 'Defamatory edit' });
          },
          (err) => {
            assert.strictEqual(err.statusCode, 404);
            assert.strictEqual(err.code, 'REVIEW_NOT_FOUND');
            return true;
          }
        );
      } finally {
        Review.findOne = origFindOne;
      }
    });

    it('rejects User B deleting User A\'s review', async () => {
      const reviewId = new mongoose.Types.ObjectId().toString();
      const origFindOneAndDelete = Review.findOneAndDelete;

      // When queried with { _id: reviewId, customerId: userB_Id }, return null
      Review.findOneAndDelete = (query) => {
        if (query.customerId && query.customerId.toString() !== userA_Id) {
          return Promise.resolve(null);
        }
        return Promise.resolve({ _id: reviewId, customerId: userA_Id });
      };

      try {
        await assert.rejects(
          async () => {
            // User B attempts to delete User A's review
            await reviewService.deleteReview(userB_Id, reviewId);
          },
          (err) => {
            assert.strictEqual(err.statusCode, 404);
            assert.strictEqual(err.code, 'REVIEW_NOT_FOUND');
            return true;
          }
        );
      } finally {
        Review.findOneAndDelete = origFindOneAndDelete;
      }
    });
  });

  // 4. CART ISOLATION MATRIX
  describe('Cart Resource Ownership', () => {
    it('strictly partitions cart operations by authenticated user ID', async () => {
      const origFindOne = Cart.findOne;
      let searchedUserId = null;

      Cart.findOne = (query) => {
        searchedUserId = query.userId;
        return Promise.resolve({
          _id: new mongoose.Types.ObjectId(),
          userId: query.userId,
          items: [],
          updatedAt: new Date()
        });
      };

      try {
        // User A requests cart
        await cartService.getCart(userA_Id);
        assert.strictEqual(searchedUserId, userA_Id, 'Cart query must strictly query authenticated user A');

        // User B requests cart
        await cartService.getCart(userB_Id);
        assert.strictEqual(searchedUserId, userB_Id, 'Cart query must strictly query authenticated user B');
      } finally {
        Cart.findOne = origFindOne;
      }
    });
  });

  // 5. ADDRESS IDOR MATRIX
  describe('Address Resource Ownership', () => {
    it('rejects User B updating User A\'s saved address', async () => {
      const addressId = new mongoose.Types.ObjectId().toString();
      const origFindById = User.findById;

      // User.findById(userB_Id) returns userB who has no address with addressId
      User.findById = (id) => {
        if (id === userB_Id) {
          return Promise.resolve({
            _id: userB_Id,
            addresses: {
              id: (_id) => null // address not found in User B's profile
            },
            save: async function() { return this; }
          });
        }
        return Promise.resolve(null);
      };

      try {
        await assert.rejects(
          async () => {
            // User B attempts to modify address on User A's profile
            await addressService.updateAddress(userB_Id, addressId, { street: 'Attacker HQ' });
          },
          (err) => {
            assert.strictEqual(err.statusCode, 404);
            assert.strictEqual(err.code, 'ADDRESS_NOT_FOUND');
            return true;
          }
        );
      } finally {
        User.findById = origFindById;
      }
    });
  });
});
