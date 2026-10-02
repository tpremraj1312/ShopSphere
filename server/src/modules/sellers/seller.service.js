const mongoose = require('mongoose');
const User = require('../users/user.model');
const Product = require('../products/product.model');
const Order = require('../orders/order.model');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const sms = require('../../shared/sms');


class SellerService {
  async requestPhoneOtp(userId, phone) {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    const otp = String(crypto.randomInt(100000, 1000000));
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    user.phoneOtpHash = otpHash;
    user.phoneOtpExpiresAt = expiresAt;
    user.phoneVerified = false;

    if (!user.sellerProfile) {
      user.sellerProfile = {};
    }
    user.sellerProfile.phone = phone;
    user.sellerProfile.phoneOtpHash = otpHash;
    user.sellerProfile.phoneOtpExpiresAt = expiresAt;
    user.sellerProfile.phoneVerified = false;

    await user.save();

    console.log(`[SELLER PHONE OTP] Generated OTP for user ${userId} (${phone}): ${otp}`);

    const delivery = await sms.sendOtp(phone, otp);
    if (!delivery.success) {
      const error = new Error('Unable to send phone verification code');
      error.statusCode = 502;
      error.code = 'PHONE_OTP_DELIVERY_FAILED';
      throw error;
    }

    return {
      phone: `${phone.slice(0, 3)}***${phone.slice(-2)}`,
      expiresInSeconds: 600,
      sandbox: delivery.sandbox,
      debugOtp: delivery.sandbox ? otp : undefined
    };
  }

  async verifyPhoneOtp(userId, otp) {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    const cleanOtp = String(otp || '').trim();
    const hash = crypto.createHash('sha256').update(cleanOtp).digest('hex');
    const storedHash = user.phoneOtpHash || user.sellerProfile?.phoneOtpHash;
    const expiresAt = user.phoneOtpExpiresAt || user.sellerProfile?.phoneOtpExpiresAt;

    if (!storedHash || storedHash !== hash || !expiresAt || new Date(expiresAt) < new Date()) {
      const error = new Error('Invalid or expired phone verification code');
      error.statusCode = 400;
      error.code = 'INVALID_PHONE_OTP';
      throw error;
    }

    user.phoneVerified = true;
    user.phoneOtpHash = undefined;
    user.phoneOtpExpiresAt = undefined;

    if (!user.sellerProfile) {
      user.sellerProfile = {};
    }
    user.sellerProfile.phoneVerified = true;
    user.sellerProfile.phoneOtpHash = undefined;
    user.sellerProfile.phoneOtpExpiresAt = undefined;

    await user.save();
    return { phoneVerified: true, message: 'Phone number verified successfully' };
  }

  /**
   * Seller application / onboarding flow (SELL-FR-01, Step 3.1.3)
   */
  async applyForSeller(userId, applicationData) {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    const isVerified = user.phoneVerified || user.sellerProfile?.phoneVerified;
    if (!isVerified) {
      const error = new Error('Verify your business phone number before submitting your seller application');
      error.statusCode = 400;
      error.code = 'PHONE_VERIFICATION_REQUIRED';
      error.isOperational = true;
      throw error;
    }

    user.sellerProfile = {
      storeName: applicationData.storeName,
      description: applicationData.description || '',
      phone: applicationData.phone,
      businessAddress: applicationData.businessAddress,
      taxId: applicationData.taxId || '',
      status: 'approved',
      appliedAt: new Date(),
      approvedAt: new Date()
    };

    // Promote to seller role
    if (user.role === 'customer') {
      user.role = 'seller';
    }

    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret_for_dev',
      { expiresIn: '7d' }
    );

    return {
      token,
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        sellerProfile: user.sellerProfile,
        phoneVerified: user.phoneVerified,
      }
    };
  }


  /**
   * Get Seller Inventory with low-stock alerts (SELL-FR-03, Step 3.1.1)
   */
  async getInventory(sellerId, options = {}) {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(options.limit) || 20));
    const threshold = Number(options.threshold) || 5;
    const lowStockOnly = options.lowStockOnly === true || options.lowStockOnly === 'true';

    const baseFilter = {
      sellerId: new mongoose.Types.ObjectId(sellerId.toString()),
      status: { $ne: 'archived' }
    };

    const allProducts = await Product.find(baseFilter).lean();

    let totalSkus = 0;
    let totalUnitsInStock = 0;
    let lowStockSkusCount = 0;
    let outOfStockSkusCount = 0;

    const inventoryItems = [];

    for (const prod of allProducts) {
      let productHasLowStock = false;

      const variants = (prod.variants || []).map(v => {
        const stock = Number(v.stock) || 0;
        const isLow = stock <= threshold && stock > 0;
        const isOut = stock === 0;

        totalSkus++;
        totalUnitsInStock += stock;
        if (isLow) lowStockSkusCount++;
        if (isOut) outOfStockSkusCount++;
        if (isLow || isOut) productHasLowStock = true;

        return {
          sku: v.sku,
          price: v.price,
          stock,
          images: v.images || [],
          attributes: v.attributes || {},
          isLowStock: isLow,
          isOutOfStock: isOut
        };
      });

      if (!lowStockOnly || productHasLowStock) {
        inventoryItems.push({
          productId: prod._id,
          title: prod.title,
          category: prod.category,
          basePrice: prod.basePrice,
          status: prod.status,
          variants,
          hasLowStock: productHasLowStock
        });
      }
    }

    // Pagination in-memory over filtered list
    const startIndex = (page - 1) * limit;
    const paginatedItems = inventoryItems.slice(startIndex, startIndex + limit);

    return {
      items: paginatedItems,
      metrics: {
        totalProducts: allProducts.length,
        totalSkus,
        totalUnitsInStock,
        lowStockSkusCount,
        outOfStockSkusCount,
        lowStockThreshold: threshold
      },
      pagination: {
        totalItems: inventoryItems.length,
        page,
        limit,
        totalPages: Math.ceil(inventoryItems.length / limit) || 1
      }
    };
  }

  /**
   * Update SKU Stock Count with server-side ownership enforcement (SELL-FR-03, SEC-04)
   */
  async updateSkuStock(sellerId, { productId, sku, stock }) {
    const product = await Product.findOne({
      _id: productId,
      sellerId: new mongoose.Types.ObjectId(sellerId.toString())
    });

    if (!product) {
      const error = new Error('Product not found or you do not have permission to manage its inventory');
      error.statusCode = 403;
      error.code = 'FORBIDDEN_OWNERSHIP';
      throw error;
    }

    const variant = product.variants.find(v => v.sku === sku);
    if (!variant) {
      const error = new Error(`Variant SKU "${sku}" not found on product`);
      error.statusCode = 404;
      error.code = 'VARIANT_NOT_FOUND';
      throw error;
    }

    variant.stock = Math.max(0, stock);
    await product.save();

    return {
      productId: product._id,
      sku: variant.sku,
      stock: variant.stock,
      price: variant.price
    };
  }

  /**
   * Get Seller Sales Analytics (SELL-FR-04, Step 3.1.2)
   * Read-only aggregation over existing Order/subOrders data
   */
  async getAnalytics(sellerId, options = {}) {
    const { timeframe = '30d' } = options;

    const daysMap = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    };
    const days = daysMap[timeframe] || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const sId = new mongoose.Types.ObjectId(sellerId.toString());

    // Aggregate matching orders
    const orders = await Order.find({
      'subOrders.sellerId': sId,
      createdAt: { $gte: cutoffDate }
    }).lean();

    let totalRevenue = 0;
    let totalUnitsSold = 0;
    let sellerOrderCount = 0;
    const dailyMap = {};
    const productMap = {};
    const statusCounts = {
      pending: 0,
      confirmed: 0,
      packed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      returned: 0
    };

    for (const order of orders) {
      // Find sub-orders belonging to this seller
      const mySubOrders = (order.subOrders || []).filter(
        sub => sub.sellerId && sub.sellerId.toString() === sId.toString()
      );

      if (mySubOrders.length === 0) continue;

      sellerOrderCount++;

      const dayKey = new Date(order.createdAt).toISOString().split('T')[0];
      if (!dailyMap[dayKey]) {
        dailyMap[dayKey] = { date: dayKey, revenue: 0, units: 0, orders: 0 };
      }
      dailyMap[dayKey].orders += 1;

      for (const sub of mySubOrders) {
        if (statusCounts[sub.status] !== undefined) {
          statusCounts[sub.status]++;
        }

        // Only calculate revenue for non-cancelled orders
        if (sub.status !== 'cancelled') {
          for (const item of sub.items || []) {
            const itemRevenue = (Number(item.unitPrice) || 0) * (Number(item.qty) || 0);
            totalRevenue += itemRevenue;
            totalUnitsSold += Number(item.qty) || 0;

            // Product aggregation
            const pId = item.productId?.toString() || item.sku;
            if (!productMap[pId]) {
              productMap[pId] = {
                productId: pId,
                title: item.title,
                unitsSold: 0,
                revenue: 0
              };
            }
            productMap[pId].unitsSold += Number(item.qty) || 0;
            productMap[pId].revenue += itemRevenue;

            // Daily trend revenue and units
            dailyMap[dayKey].revenue += itemRevenue;
            dailyMap[dayKey].units += Number(item.qty) || 0;
          }
        }
      }
    }

    // Sort top products by revenue
    const topProducts = Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(p => ({
        ...p,
        revenue: Number(p.revenue.toFixed(2))
      }));

    // Convert daily trend to sorted array
    const revenueOverTime = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    const averageOrderValue = sellerOrderCount > 0 ? totalRevenue / sellerOrderCount : 0;
    const returnedOrCancelled = (statusCounts.cancelled || 0) + (statusCounts.returned || 0);
    const returnRate = sellerOrderCount > 0 ? (returnedOrCancelled / sellerOrderCount) * 100 : 0;

    const kpis = {
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalOrders: sellerOrderCount,
      totalUnitsSold,
      totalUnits: totalUnitsSold,
      averageOrderValue: Number(averageOrderValue.toFixed(2)),
      returnRate: Number(returnRate.toFixed(1))
    };

    const timeSeries = revenueOverTime.map(d => ({
      date: d.date ? d.date.slice(5) : d.date,
      revenue: d.revenue || 0,
      orders: d.orders || 0,
    }));

    return {
      timeframe,
      summary: kpis,
      kpis,
      revenueOverTime,
      timeSeries,
      topProducts,
      statusDistribution: statusCounts
    };
  }


  /**
   * Bulk Product Upload via CSV (SELL-FR-05, Step 3.1.4)
   * Expected CSV format headers:
   * title,description,categoryL1,categoryL2,categoryL3,basePrice,sku,price,stock,imageUrl
   */
  async bulkUploadCsv(sellerId, csvString) {
    if (!csvString || typeof csvString !== 'string') {
      const error = new Error('Invalid CSV payload');
      error.statusCode = 400;
      error.code = 'INVALID_CSV';
      throw error;
    }

    const lines = csvString.trim().split(/\r?\n/);
    if (lines.length < 2) {
      const error = new Error('CSV must contain a header row and at least one data row');
      error.statusCode = 400;
      error.code = 'EMPTY_CSV';
      throw error;
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredCols = ['title', 'categoryl1', 'categoryl2', 'baseprice', 'sku', 'price', 'stock'];
    for (const col of requiredCols) {
      if (!headers.includes(col)) {
        const error = new Error(`CSV missing required column header: "${col}"`);
        error.statusCode = 400;
        error.code = 'INVALID_CSV_HEADERS';
        throw error;
      }
    }

    const results = {
      totalRows: lines.length - 1,
      created: 0,
      errors: []
    };

    // Process line by line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const values = line.split(',').map(v => v.trim());
        const rowData = {};
        headers.forEach((h, idx) => {
          rowData[h] = values[idx] || '';
        });

        const title = rowData.title;
        const description = rowData.description || `${title} description`;
        const l1 = rowData.categoryl1;
        const l2 = rowData.categoryl2;
        const l3 = rowData.categoryl3 || '';
        const basePrice = Number(rowData.baseprice);
        const sku = rowData.sku;
        const price = Number(rowData.price) || basePrice;
        const stock = Number(rowData.stock) || 0;
        const imageUrl = rowData.imageurl || '';

        if (!title || !l1 || !l2 || isNaN(basePrice) || !sku) {
          throw new Error('Missing required fields or invalid numeric values');
        }

        const product = new Product({
          sellerId,
          title,
          description,
          category: { l1, l2, l3 },
          basePrice,
          variants: [{
            sku,
            price,
            stock,
            images: imageUrl ? [imageUrl] : []
          }],
          status: 'published'
        });

        await product.save();
        results.created++;
      } catch (err) {
        results.errors.push({
          row: i + 1,
          message: err.message
        });
      }
    }

    return results;
  }
}

module.exports = new SellerService();
