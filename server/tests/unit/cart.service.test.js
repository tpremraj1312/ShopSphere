const { test, describe } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const cartService = require('../../src/modules/cart/cart.service');
const Cart = require('../../src/modules/cart/cart.model');
const Product = require('../../src/modules/products/product.model');
const {
  addToCartSchema,
  updateCartItemSchema,
  mergeCartSchema
} = require('../../src/modules/cart/cart.validation');

describe('Cart Model & Validation', () => {
  test('addToCartSchema validates correct productId, sku, and positive qty', () => {
    const validId = new mongoose.Types.ObjectId().toString();
    const result = addToCartSchema.safeParse({
      body: { productId: validId, sku: 'SKU-001', qty: 2 }
    });
    assert.strictEqual(result.success, true);
  });

  test('addToCartSchema rejects negative or zero quantity', () => {
    const validId = new mongoose.Types.ObjectId().toString();
    const result = addToCartSchema.safeParse({
      body: { productId: validId, sku: 'SKU-001', qty: 0 }
    });
    assert.strictEqual(result.success, false);
  });

  test('mergeCartSchema requires guestId', () => {
    const invalid = mergeCartSchema.safeParse({ body: {} });
    assert.strictEqual(invalid.success, false);

    const valid = mergeCartSchema.safeParse({ body: { guestId: 'guest-uuid-123' } });
    assert.strictEqual(valid.success, true);
  });
});

describe('Cart Service — Add Item, Subtotal, and Stock Enforcement', () => {
  test('addItem checks product status and variant stock', async () => {
    const userId = new mongoose.Types.ObjectId();
    const productId = new mongoose.Types.ObjectId();

    const mockProduct = {
      _id: productId,
      title: 'Gaming Mouse',
      status: 'published',
      variants: [{ sku: 'GM-1', price: 49.99, stock: 5, images: ['image.jpg'] }]
    };

    const originalFindById = Product.findById;
    const originalFindOne = Cart.findOne;

    Product.findById = () => Promise.resolve(mockProduct);

    const mockCartDoc = {
      _id: new mongoose.Types.ObjectId(),
      userId,
      items: [],
      save: async () => mockCartDoc
    };

    Cart.findOne = () => Promise.resolve(mockCartDoc);

    try {
      const updatedCart = await cartService.addItem(userId, null, {
        productId: productId.toString(),
        sku: 'GM-1',
        qty: 2
      });

      assert.strictEqual(updatedCart.items.length, 1);
      assert.strictEqual(updatedCart.items[0].qty, 2);
      assert.strictEqual(updatedCart.items[0].priceSnapshot, 49.99);
      assert.strictEqual(updatedCart.subtotal, 99.98);
      assert.strictEqual(updatedCart.totalItems, 2);
    } finally {
      Product.findById = originalFindById;
      Cart.findOne = originalFindOne;
    }
  });

  test('addItem rejects when quantity exceeds available stock', async () => {
    const userId = new mongoose.Types.ObjectId();
    const productId = new mongoose.Types.ObjectId();

    const mockProduct = {
      _id: productId,
      title: 'Gaming Mouse',
      status: 'published',
      variants: [{ sku: 'GM-1', price: 49.99, stock: 2, images: [] }]
    };

    const originalFindById = Product.findById;
    Product.findById = () => Promise.resolve(mockProduct);

    try {
      await assert.rejects(
        async () => {
          await cartService.addItem(userId, null, {
            productId: productId.toString(),
            sku: 'GM-1',
            qty: 5
          });
        },
        (err) => {
          assert.strictEqual(err.statusCode, 400);
          assert.strictEqual(err.code, 'INSUFFICIENT_STOCK');
          return true;
        }
      );
    } finally {
      Product.findById = originalFindById;
    }
  });
});

describe('Cart Service — Guest to User Merge Logic (CART-FR-01)', () => {
  test('merges guest cart items into user cart without duplicates (sums quantities)', async () => {
    const userId = new mongoose.Types.ObjectId();
    const guestId = 'guest-uuid-12345';
    const prodA = new mongoose.Types.ObjectId();
    const prodB = new mongoose.Types.ObjectId();

    const guestCartDoc = {
      _id: new mongoose.Types.ObjectId(),
      guestId,
      userId: null,
      items: [
        { productId: prodA, sku: 'SKU-A', title: 'Product A', qty: 2, priceSnapshot: 20 },
        { productId: prodB, sku: 'SKU-B', title: 'Product B', qty: 1, priceSnapshot: 50 }
      ]
    };

    const userCartDoc = {
      _id: new mongoose.Types.ObjectId(),
      userId,
      items: [
        // User already has 1 of Product A
        { productId: prodA, sku: 'SKU-A', title: 'Product A', qty: 1, priceSnapshot: 20 }
      ],
      save: async () => userCartDoc
    };

    const originalFindOne = Cart.findOne;
    const originalDeleteOne = Cart.deleteOne;

    let deleteCalledWith = null;

    Cart.findOne = (query) => {
      if (query.guestId) return Promise.resolve(guestCartDoc);
      if (query.userId) return Promise.resolve(userCartDoc);
      return Promise.resolve(null);
    };

    Cart.deleteOne = (query) => {
      deleteCalledWith = query;
      return Promise.resolve({ acknowledged: true, deletedCount: 1 });
    };

    try {
      const merged = await cartService.mergeGuestCart(userId, guestId);

      // Verify merged cart has 2 unique item types, not 3 duplicates
      assert.strictEqual(merged.items.length, 2);

      // Product A should now have qty: 1 (existing) + 2 (guest) = 3
      const itemA = merged.items.find((i) => i.sku === 'SKU-A');
      assert.ok(itemA);
      assert.strictEqual(itemA.qty, 3);

      // Product B should be added with qty: 1
      const itemB = merged.items.find((i) => i.sku === 'SKU-B');
      assert.ok(itemB);
      assert.strictEqual(itemB.qty, 1);

      // Total items = 3 + 1 = 4
      assert.strictEqual(merged.totalItems, 4);
      // Subtotal = (3 * 20) + (1 * 50) = 60 + 50 = 110
      assert.strictEqual(merged.subtotal, 110);

      // Guest cart was purged
      assert.deepStrictEqual(deleteCalledWith, { _id: guestCartDoc._id });
    } finally {
      Cart.findOne = originalFindOne;
      Cart.deleteOne = originalDeleteOne;
    }
  });
});
