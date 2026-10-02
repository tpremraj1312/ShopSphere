const { test, describe } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const productService = require('../../src/modules/products/product.service');
const Product = require('../../src/modules/products/product.model');
const {
  createProductSchema,
  updateProductSchema
} = require('../../src/modules/products/product.validation');

describe('Product Schema & Validation', () => {
  test('rejects product creation with negative basePrice', () => {
    const result = createProductSchema.safeParse({
      body: {
        title: 'Wireless Bluetooth Headphones',
        description: 'Premium noise-cancelling over-ear headphones',
        category: { l1: 'Electronics', l2: 'Audio' },
        basePrice: -29.99
      }
    });
    assert.strictEqual(result.success, false);
  });

  test('rejects product creation with missing category.l1', () => {
    const result = createProductSchema.safeParse({
      body: {
        title: 'Wireless Bluetooth Headphones',
        description: 'Premium noise-cancelling over-ear headphones',
        category: { l2: 'Audio' },
        basePrice: 99.99
      }
    });
    assert.strictEqual(result.success, false);
  });

  test('accepts valid product creation payload with variants', () => {
    const result = createProductSchema.safeParse({
      body: {
        title: 'Mechanical Gaming Keyboard',
        description: 'RGB mechanical keyboard with hot-swappable switches',
        category: { l1: 'Electronics', l2: 'Computers & Accessories', l3: 'Keyboards' },
        basePrice: 129.99,
        variants: [
          { sku: 'KB-BLK-RED', attributes: { color: 'Black', switch: 'Red' }, price: 129.99, stock: 50 },
          { sku: 'KB-WHT-BLU', attributes: { color: 'White', switch: 'Blue' }, price: 139.99, stock: 35 }
        ],
        status: 'published',
        searchKeywords: ['keyboard', 'gaming', 'rgb', 'mechanical']
      }
    });
    assert.strictEqual(result.success, true);
  });
});

describe('Product Service — Server-Side Ownership Check (SEC-04)', () => {
  test('updateProduct: rejects cross-seller update with 403 Forbidden', async () => {
    const sellerAId = new mongoose.Types.ObjectId();
    const sellerBId = new mongoose.Types.ObjectId();
    const productId = new mongoose.Types.ObjectId();

    const originalFindById = Product.findById;
    Product.findById = (id) => {
      assert.strictEqual(id.toString(), productId.toString());
      return Promise.resolve({
        _id: productId,
        sellerId: sellerAId,
        title: "Seller A's Original Product"
      });
    };

    try {
      await assert.rejects(
        async () => {
          await productService.updateProduct(sellerBId, productId, {
            title: "Hacked by Seller B"
          });
        },
        (err) => {
          assert.strictEqual(err.statusCode, 403);
          assert.strictEqual(err.code, 'FORBIDDEN_OWNERSHIP');
          assert.strictEqual(err.message, 'You do not have permission to modify this product');
          return true;
        }
      );
    } finally {
      Product.findById = originalFindById;
    }
  });

  test('deleteProduct: rejects cross-seller delete with 403 Forbidden', async () => {
    const sellerAId = new mongoose.Types.ObjectId();
    const sellerBId = new mongoose.Types.ObjectId();
    const productId = new mongoose.Types.ObjectId();

    const originalFindById = Product.findById;
    Product.findById = (id) => {
      assert.strictEqual(id.toString(), productId.toString());
      return Promise.resolve({
        _id: productId,
        sellerId: sellerAId,
        title: "Seller A's Original Product"
      });
    };

    try {
      await assert.rejects(
        async () => {
          await productService.deleteProduct(sellerBId, productId);
        },
        (err) => {
          assert.strictEqual(err.statusCode, 403);
          assert.strictEqual(err.code, 'FORBIDDEN_OWNERSHIP');
          assert.strictEqual(err.message, 'You do not have permission to delete this product');
          return true;
        }
      );
    } finally {
      Product.findById = originalFindById;
    }
  });

  test('updateProduct: permits update when sellerId matches owner', async () => {
    const sellerAId = new mongoose.Types.ObjectId();
    const productId = new mongoose.Types.ObjectId();

    const mockDoc = {
      _id: productId,
      sellerId: sellerAId,
      title: "Seller A's Original Product",
      async save() {
        return this;
      }
    };

    const originalFindById = Product.findById;
    Product.findById = () => Promise.resolve(mockDoc);

    try {
      const updated = await productService.updateProduct(sellerAId, productId, {
        title: "Seller A's Updated Product"
      });
      assert.strictEqual(updated.title, "Seller A's Updated Product");
    } finally {
      Product.findById = originalFindById;
    }
  });

  test('deleteProduct: permits delete when sellerId matches owner', async () => {
    const sellerAId = new mongoose.Types.ObjectId();
    const productId = new mongoose.Types.ObjectId();

    const mockDoc = {
      _id: productId,
      sellerId: sellerAId
    };

    const originalFindById = Product.findById;
    const originalDeleteOne = Product.deleteOne;

    Product.findById = () => Promise.resolve(mockDoc);
    Product.deleteOne = ({ _id }) => {
      assert.strictEqual(_id.toString(), productId.toString());
      return Promise.resolve({ acknowledged: true, deletedCount: 1 });
    };

    try {
      const result = await productService.deleteProduct(sellerAId, productId);
      assert.strictEqual(result.deleted, true);
    } finally {
      Product.findById = originalFindById;
      Product.deleteOne = originalDeleteOne;
    }
  });
});

describe('Product Service — Catalog Queries & Detail', () => {
  test('getProductById: returns product when found', async () => {
    const productId = new mongoose.Types.ObjectId();
    const mockProduct = {
      _id: productId,
      title: 'Gaming Mouse',
      populate: () => Promise.resolve(mockProduct)
    };

    const originalFindById = Product.findById;
    Product.findById = () => mockProduct;

    try {
      const result = await productService.getProductById(productId);
      assert.strictEqual(result.title, 'Gaming Mouse');
    } finally {
      Product.findById = originalFindById;
    }
  });

  test('getProductById: throws 404 when product is not found', async () => {
    const productId = new mongoose.Types.ObjectId();

    const originalFindById = Product.findById;
    Product.findById = () => ({
      populate: () => Promise.resolve(null)
    });

    try {
      await assert.rejects(
        async () => {
          await productService.getProductById(productId);
        },
        (err) => {
          assert.strictEqual(err.statusCode, 404);
          assert.strictEqual(err.code, 'PRODUCT_NOT_FOUND');
          return true;
        }
      );
    } finally {
      Product.findById = originalFindById;
    }
  });

  test('getSellerProducts: queries seller products and total count', async () => {
    const sellerId = new mongoose.Types.ObjectId();
    const mockList = [{ title: 'Item 1' }, { title: 'Item 2' }];

    const originalFind = Product.find;
    const originalCount = Product.countDocuments;

    Product.find = (q) => ({
      sort: () => ({
        skip: () => ({
          limit: () => Promise.resolve(mockList)
        })
      })
    });
    Product.countDocuments = () => Promise.resolve(2);

    try {
      const result = await productService.getSellerProducts(sellerId, { limit: 10, skip: 0 });
      assert.strictEqual(result.products.length, 2);
      assert.strictEqual(result.total, 2);
    } finally {
      Product.find = originalFind;
      Product.countDocuments = originalCount;
    }
  });

  test('listProducts: computes cursor pagination and filters', async () => {
    const id1 = new mongoose.Types.ObjectId();
    const id2 = new mongoose.Types.ObjectId();
    const mockProducts = [
      { _id: id1, title: 'Item 1', basePrice: 20 },
      { _id: id2, title: 'Item 2', basePrice: 40 }
    ];

    const originalFind = Product.find;
    Product.find = () => ({
      sort: () => ({
        limit: () => Promise.resolve(mockProducts)
      })
    });

    try {
      const result = await productService.listProducts({
        categoryL1: 'Books',
        minPrice: 10,
        maxPrice: 50,
        limit: 2
      });

      assert.strictEqual(result.products.length, 2);
      assert.strictEqual(result.pagination.count, 2);
    } finally {
      Product.find = originalFind;
    }
  });

  test('getCategories: builds 3-level tree from aggregation', async () => {
    const mockAgg = [
      { _id: { l1: 'Electronics', l2: 'Audio', l3: 'Headphones' }, count: 12 },
      { _id: { l1: 'Electronics', l2: 'Audio', l3: 'Speakers' }, count: 5 }
    ];

    const originalAggregate = Product.aggregate;
    Product.aggregate = () => Promise.resolve(mockAgg);

    try {
      const tree = await productService.getCategories();
      assert.strictEqual(tree.length, 1);
      assert.strictEqual(tree[0].name, 'Electronics');
      assert.strictEqual(tree[0].subcategories.length, 1);
      assert.strictEqual(tree[0].subcategories[0].name, 'Audio');
      assert.deepStrictEqual(tree[0].subcategories[0].subcategories, ['Headphones', 'Speakers']);
    } finally {
      Product.aggregate = originalAggregate;
    }
  });
});

describe('Product Service — Search Upgrade & Faceted Filtering (Step 3.3, CAT-FR-03, 04, 06)', () => {
  const Order = require('../../src/modules/orders/order.model');

  test('typo-tolerant search matches misspelled query ("wirless mouse") against "Wireless Mouse" (Step 3.3 Acceptance Check)', () => {
    const { buildTypoRegex } = require('../../src/modules/products/product.service');
    const wirlessRx = buildTypoRegex('wirless');
    const mouseRx = buildTypoRegex('mouse');

    assert.ok(wirlessRx.test('Ergonomic Wireless Mouse'));
    assert.ok(mouseRx.test('Ergonomic Wireless Mouse'));

    // Also test common typos
    const keyboerdRx = buildTypoRegex('keyboerd');
    assert.ok(keyboerdRx.test('Mechanical Gaming Keyboard'));

    const mouesRx = buildTypoRegex('moues');
    assert.ok(mouesRx.test('Precision Gaming Mouse'));
  });

  test('listProducts combines search query with faceted filters (price + rating) (CAT-FR-03, 04)', async () => {
    let capturedQuery = null;
    const originalFind = Product.find;
    Product.find = (q) => {
      capturedQuery = q;
      return {
        sort: () => ({
          limit: () => Promise.resolve([
            {
              _id: new mongoose.Types.ObjectId(),
              title: 'Ergonomic Wireless Mouse',
              basePrice: 45.0,
              ratingAvg: 4.8,
              status: 'published'
            }
          ])
        })
      };
    };

    try {
      const result = await productService.listProducts({
        search: 'wirless mouse',
        minPrice: 30,
        maxPrice: 60,
        minRating: 4,
        inStockOnly: true
      });

      assert.strictEqual(result.products.length, 1);
      assert.strictEqual(capturedQuery.status, 'published');
      assert.strictEqual(capturedQuery.basePrice.$gte, 30);
      assert.strictEqual(capturedQuery.basePrice.$lte, 60);
      assert.strictEqual(capturedQuery.ratingAvg.$gte, 4);
      assert.strictEqual(capturedQuery['variants.stock'].$gt, 0);
      assert.ok(Array.isArray(capturedQuery.$and));
      assert.strictEqual(capturedQuery.$and.length, 2); // 2 tokens: 'wirless' and 'mouse'
    } finally {
      Product.find = originalFind;
    }
  });

  test('getAlsoBought aggregates co-purchase frequency from Order collection (CAT-FR-06)', async () => {
    const targetProdId = new mongoose.Types.ObjectId();
    const alsoBoughtProdId1 = new mongoose.Types.ObjectId();
    const alsoBoughtProdId2 = new mongoose.Types.ObjectId();

    const mockOrders = [
      {
        _id: new mongoose.Types.ObjectId(),
        status: 'delivered',
        subOrders: [
          {
            items: [
              { productId: targetProdId, qty: 1 },
              { productId: alsoBoughtProdId1, qty: 2 } // bought 2 times with target
            ]
          }
        ]
      },
      {
        _id: new mongoose.Types.ObjectId(),
        status: 'confirmed',
        subOrders: [
          {
            items: [
              { productId: targetProdId, qty: 1 },
              { productId: alsoBoughtProdId1, qty: 1 },
              { productId: alsoBoughtProdId2, qty: 1 }
            ]
          }
        ]
      }
    ];

    const originalOrderFind = Order.find;
    const originalProdFind = Product.find;

    Order.find = () => ({ lean: async () => mockOrders });
    Product.find = ({ _id }) => ({
      lean: async () => [
        { _id: alsoBoughtProdId1, title: 'USB-C Cable', basePrice: 15 },
        { _id: alsoBoughtProdId2, title: 'Mouse Pad', basePrice: 12 }
      ]
    });

    try {
      const recommendations = await productService.getAlsoBought(targetProdId, 2);
      assert.strictEqual(recommendations.length, 2);
      assert.strictEqual(recommendations[0].title, 'USB-C Cable');
    } finally {
      Order.find = originalOrderFind;
      Product.find = originalProdFind;
    }
  });
});
