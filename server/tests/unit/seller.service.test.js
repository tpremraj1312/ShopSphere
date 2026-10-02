const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const sellerService = require('../../src/modules/sellers/seller.service');
const User = require('../../src/modules/users/user.model');
const Product = require('../../src/modules/products/product.model');
const Order = require('../../src/modules/orders/order.model');

describe('Seller Dashboard — Inventory, Analytics, Onboarding & Bulk CSV (Step 3.1, SELL-FR-01 to 05)', () => {
  const sellerId = new mongoose.Types.ObjectId();
  const otherSellerId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    User.findById = async () => null;
    Product.find = () => ({ lean: async () => [] });
    Product.findOne = async () => null;
    Product.prototype.save = async function () { return this; };
    Order.find = () => ({ lean: async () => [] });
  });

  it('applyForSeller adds sellerProfile and upgrades customer role to seller (SELL-FR-01)', async () => {
    const mockUser = {
      _id: 'user123',
      email: 'merchant@test.com',
      role: 'customer',
      save: async function () { return this; }
    };
    User.findById = async (id) => (id === 'user123' ? mockUser : null);

    const result = await sellerService.applyForSeller('user123', {
      storeName: 'Prem Electronics',
      description: 'Top electronics distributor',
      phone: '+1-555-0199',
      businessAddress: {
        street: '100 Silicon Way',
        city: 'Austin',
        state: 'TX',
        postalCode: '78701',
        country: 'USA'
      },
      taxId: 'US-TX-998877'
    });

    assert.strictEqual(result.role, 'seller');
    assert.strictEqual(result.sellerProfile.storeName, 'Prem Electronics');
    assert.strictEqual(result.sellerProfile.status, 'approved');
  });

  it('getInventory flags low-stock variants and calculates summary metrics (SELL-FR-03)', async () => {
    const mockProducts = [
      {
        _id: 'prod1',
        title: 'Wireless Keyboard',
        category: { l1: 'Electronics', l2: 'Accessories' },
        basePrice: 49.99,
        status: 'published',
        variants: [
          { sku: 'KB-BLK', stock: 12, price: 49.99 },
          { sku: 'KB-WHT', stock: 3, price: 49.99 }, // Low stock (<= 5)
        ]
      },
      {
        _id: 'prod2',
        title: 'Ergonomic Mouse',
        category: { l1: 'Electronics', l2: 'Accessories' },
        basePrice: 29.99,
        status: 'published',
        variants: [
          { sku: 'MS-BLK', stock: 0, price: 29.99 } // Out of stock
        ]
      }
    ];

    Product.find = () => ({ lean: async () => mockProducts });

    const result = await sellerService.getInventory(sellerId, { threshold: 5 });

    assert.strictEqual(result.metrics.totalProducts, 2);
    assert.strictEqual(result.metrics.totalSkus, 3);
    assert.strictEqual(result.metrics.totalUnitsInStock, 15);
    assert.strictEqual(result.metrics.lowStockSkusCount, 1);
    assert.strictEqual(result.metrics.outOfStockSkusCount, 1);

    const kbItem = result.items.find(i => i.productId === 'prod1');
    assert.strictEqual(kbItem.hasLowStock, true);
    assert.strictEqual(kbItem.variants[0].isLowStock, false);
    assert.strictEqual(kbItem.variants[1].isLowStock, true);
  });

  it('updateSkuStock updates variant stock count and rejects unauthorized seller (SEC-04)', async () => {
    let saved = false;
    const mockProduct = {
      _id: 'prod1',
      sellerId,
      variants: [
        { sku: 'KB-BLK', stock: 10, price: 50 },
        { sku: 'KB-WHT', stock: 2, price: 50 }
      ],
      save: async function () {
        saved = true;
        return this;
      }
    };

    Product.findOne = async (query) => {
      if (query._id === 'prod1' && query.sellerId.toString() === sellerId.toString()) {
        return mockProduct;
      }
      return null;
    };

    // 1. Successful update by owner
    const result = await sellerService.updateSkuStock(sellerId, {
      productId: 'prod1',
      sku: 'KB-WHT',
      stock: 25
    });

    assert.strictEqual(saved, true);
    assert.strictEqual(result.stock, 25);
    assert.strictEqual(mockProduct.variants[1].stock, 25);

    // 2. Rejected when different seller tries to update
    await assert.rejects(
      async () => {
        await sellerService.updateSkuStock(otherSellerId, {
          productId: 'prod1',
          sku: 'KB-WHT',
          stock: 100
        });
      },
      (err) => {
        assert.strictEqual(err.statusCode, 403);
        assert.strictEqual(err.code, 'FORBIDDEN_OWNERSHIP');
        return true;
      }
    );
  });

  it('getAnalytics accurately computes revenue, top products, and order volume for 20+ orders (SELL-FR-04 Acceptance Check)', async () => {
    // Generate 25 mock orders for sellerId
    const mockOrders = [];
    let expectedTotalRevenue = 0;
    let expectedTotalUnits = 0;

    for (let i = 1; i <= 25; i++) {
      const isTopProduct = i % 2 === 0;
      const unitPrice = isTopProduct ? 100 : 50;
      const qty = isTopProduct ? 2 : 1;
      const orderRev = unitPrice * qty;

      expectedTotalRevenue += orderRev;
      expectedTotalUnits += qty;

      mockOrders.push({
        _id: `order_${i}`,
        createdAt: new Date(Date.now() - (i * 3600000)), // spread over last 25 hours
        subOrders: [
          {
            sellerId,
            status: i === 1 ? 'delivered' : 'confirmed',
            items: [
              {
                productId: isTopProduct ? 'prod_laptop' : 'prod_mouse',
                title: isTopProduct ? 'Pro Gaming Laptop' : 'Wireless Mouse',
                sku: isTopProduct ? 'SKU-LAPTOP' : 'SKU-MOUSE',
                unitPrice,
                qty
              }
            ]
          }
        ]
      });
    }

    Order.find = () => ({ lean: async () => mockOrders });

    const analytics = await sellerService.getAnalytics(sellerId, { timeframe: '30d' });

    assert.strictEqual(analytics.summary.totalOrders, 25, 'Should count all 25 orders');
    assert.strictEqual(analytics.summary.totalRevenue, expectedTotalRevenue, 'Should match exact revenue aggregation');
    assert.strictEqual(analytics.summary.totalUnitsSold, expectedTotalUnits, 'Should match exact units sold');
    assert.strictEqual(analytics.summary.averageOrderValue, Number((expectedTotalRevenue / 25).toFixed(2)));

    // Top products
    assert.ok(analytics.topProducts.length >= 2);
    assert.strictEqual(analytics.topProducts[0].productId, 'prod_laptop', 'Laptop should be top product by revenue');
  });

  it('bulkUploadCsv parses valid CSV and creates products for seller (SELL-FR-05)', async () => {
    const csvContent = `title,description,categoryL1,categoryL2,categoryL3,basePrice,sku,price,stock,imageUrl
Mechanical Keyboard,Clicky RGB switches,Electronics,Keyboards,Gaming,89.99,KB-RGB-01,89.99,50,https://example.com/kb.jpg
Gaming Headset,Surround 7.1 audio,Electronics,Audio,Headsets,49.99,HS-71-01,49.99,35,https://example.com/hs.jpg`;

    let createdProducts = 0;
    Product.prototype.save = async function () {
      createdProducts++;
      return this;
    };

    const result = await sellerService.bulkUploadCsv(sellerId, csvContent);

    assert.strictEqual(result.totalRows, 2);
    assert.strictEqual(result.created, 2);
    assert.strictEqual(result.errors.length, 0);
  });
});
