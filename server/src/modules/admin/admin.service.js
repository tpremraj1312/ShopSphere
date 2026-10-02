const User = require('../users/user.model');
const Product = require('../products/product.model');
const Order = require('../orders/order.model');
const RefreshToken = require('../auth/refreshToken.model');
const auditService = require('../audit/audit.service');
const { escapeRegex } = require('../../shared/sanitize');
const bcrypt = require('bcrypt');
const twoFactorService = require('../auth/twoFactor.service');
const { generateStepUpToken } = require('../../middleware/stepUpAuth');
const stateMachine = require('../orders/orderStateMachine');

/**
 * AdminService — Core admin management operations (ADM-FR-01 to 05, SEC-06, SEC-21)
 */
class AdminService {
  /**
   * Step-up Re-Authentication (ADM-FR-05, SEC-06)
   * Validates admin's password or 2FA code and issues a 5-minute elevated action token.
   */
  async verifyStepUp(adminId, { password, code }, req) {
    const admin = await User.findById(adminId);
    if (!admin) {
      const err = new Error('Admin user not found');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      err.isOperational = true;
      throw err;
    }

    let verified = false;

    // Password verification
    if (password && admin.passwordHash) {
      verified = await bcrypt.compare(password, admin.passwordHash);
    }

    // TOTP verification if 2FA is active
    if (!verified && code && admin.twoFactorEnabled) {
      verified = await twoFactorService.validateCode(adminId, code);
    }

    if (!verified) {
      const err = new Error('Step-up authentication failed: invalid password or 2FA code');
      err.statusCode = 401;
      err.code = 'STEP_UP_FAILED';
      err.isOperational = true;
      throw err;
    }

    const stepUpToken = generateStepUpToken(admin, 'admin:elevated');

    // Audit log the step-up event
    await auditService.log(req, {
      action: 'admin.step_up_auth',
      targetType: 'user',
      targetId: admin._id,
      details: { method: password ? 'password' : 'totp' }
    });

    return { stepUpToken, expiresIn: '5m' };
  }

  /**
   * List users with pagination and search/filtering (ADM-FR-01)
   */
  async listUsers({ page = 1, limit = 20, search, role, status }) {
    const query = {};

    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.email = { $regex: escapeRegex(search), $options: 'i' };
    }

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-passwordHash -twoFactorSecret -twoFactorRecoveryCodes')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query)
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Suspend user (ADM-FR-01, SEC-21)
   * Revokes all active refresh tokens immediately to kick active sessions.
   */
  async suspendUser(userId, reason, req) {
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      err.code = 'USER_NOT_FOUND';
      err.isOperational = true;
      throw err;
    }

    // Super_admin protection: cannot suspend super_admin or self
    if (user.role === 'super_admin' || user._id.toString() === req.user._id.toString()) {
      const err = new Error('Cannot suspend this privileged user or self');
      err.statusCode = 403;
      err.code = 'FORBIDDEN_SUSPEND';
      err.isOperational = true;
      throw err;
    }

    const previousStatus = user.status;
    user.status = 'suspended';
    await user.save();

    // Revoke all existing sessions
    await RefreshToken.updateMany({ userId: user._id }, { isRevoked: true });

    // Write audit log entry
    await auditService.log(req, {
      action: 'user.suspend',
      targetType: 'user',
      targetId: user._id,
      details: { reason },
      previousState: { status: previousStatus },
      newState: { status: 'suspended' }
    });

    return { user: { id: user._id, email: user.email, status: user.status } };
  }

  /**
   * Reinstate suspended user (ADM-FR-01, SEC-21)
   */
  async reinstateUser(userId, reason, req) {
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      err.code = 'USER_NOT_FOUND';
      err.isOperational = true;
      throw err;
    }

    const previousStatus = user.status;
    user.status = 'active';
    await user.save();

    // Write audit log entry
    await auditService.log(req, {
      action: 'user.reinstate',
      targetType: 'user',
      targetId: user._id,
      details: { reason },
      previousState: { status: previousStatus },
      newState: { status: 'active' }
    });

    return { user: { id: user._id, email: user.email, status: user.status } };
  }

  /**
   * List all products for moderation (ADM-FR-02)
   */
  async listProductsForModeration({ page = 1, limit = 20, status, search }) {
    const query = {};
    if (status) query.status = status;
    if (search) {
      query.title = { $regex: escapeRegex(search), $options: 'i' };
    }

    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('sellerId', 'email sellerProfile.storeName')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit),
      Product.countDocuments(query)
    ]);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Moderate listing — publish, unpublish, or archive (ADM-FR-02, SEC-21)
   */
  async moderateListing(productId, { status, reason }, req) {
    if (!['published', 'unpublished', 'archived', 'draft'].includes(status)) {
      const err = new Error('Invalid product status');
      err.statusCode = 400;
      err.code = 'INVALID_STATUS';
      err.isOperational = true;
      throw err;
    }

    const product = await Product.findById(productId);
    if (!product) {
      const err = new Error('Product not found');
      err.statusCode = 404;
      err.code = 'PRODUCT_NOT_FOUND';
      err.isOperational = true;
      throw err;
    }

    const previousStatus = product.status;
    product.status = status;
    await product.save();

    const action = status === 'published' ? 'listing.republish' : 'listing.unpublish';

    await auditService.log(req, {
      action,
      targetType: 'product',
      targetId: product._id,
      details: { reason, previousStatus, newStatus: status, title: product.title },
      previousState: { status: previousStatus },
      newState: { status }
    });

    return product;
  }

  /**
   * Force refund an order (2.6.4 / ADM-FR-05, SEC-21)
   * Transitions sub-orders to refunded and creates audit log.
   */
  async forceRefundOrder(orderId, { reason, subOrderId }, req) {
    const order = await Order.findById(orderId);
    if (!order) {
      const err = new Error('Order not found');
      err.statusCode = 404;
      err.code = 'ORDER_NOT_FOUND';
      err.isOperational = true;
      throw err;
    }

    const previousState = {
      paymentStatus: order.payment.status,
      subOrders: order.subOrders.map(s => ({ id: s._id, status: s.status }))
    };

    if (subOrderId) {
      const sub = order.subOrders.id(subOrderId);
      if (!sub) {
        const err = new Error('Sub-order not found');
        err.statusCode = 404;
        err.code = 'SUB_ORDER_NOT_FOUND';
        err.isOperational = true;
        throw err;
      }
      const from = sub.status;
      sub.status = 'cancelled';
      if (!sub.statusHistory) sub.statusHistory = [];
      sub.statusHistory.push({
        from,
        to: 'cancelled',
        changedBy: req.user._id,
        reason: reason || 'Admin forced refund',
        changedAt: new Date()
      });
    } else {
      for (const sub of order.subOrders) {
        if (sub.status !== 'cancelled') {
          const from = sub.status;
          sub.status = 'cancelled';
          if (!sub.statusHistory) sub.statusHistory = [];
          sub.statusHistory.push({
            from,
            to: 'cancelled',
            changedBy: req.user._id,
            reason: reason || 'Admin forced platform refund',
            changedAt: new Date()
          });
        }
      }
      order.payment.status = 'refunded';
    }

    await order.save();

    await auditService.log(req, {
      action: 'order.force_refund',
      targetType: 'order',
      targetId: order._id,
      details: { reason, subOrderId },
      previousState,
      newState: {
        paymentStatus: order.payment.status,
        subOrders: order.subOrders.map(s => ({ id: s._id, status: s.status }))
      }
    });

    return order;
  }

  /**
   * Platform Metrics (ADM-FR-03)
   */
  async getPlatformMetrics() {
    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      totalSellers,
      totalProducts,
      publishedProducts,
      totalOrders,
      ordersByStatus,
      revenueResult
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ status: 'suspended' }),
      User.countDocuments({ role: 'seller' }),
      Product.countDocuments(),
      Product.countDocuments({ status: 'published' }),
      Order.countDocuments(),
      Order.aggregate([
        { $unwind: '$subOrders' },
        { $group: { _id: '$subOrders.status', count: { $sum: 1 } } }
      ]),
      Order.aggregate([
        { $match: { 'payment.status': { $in: ['completed', 'paid'] } } },
        { $group: { _id: null, totalGMV: { $sum: '$pricing.total' } } }
      ])
    ]);

    const statusCounts = {};
    for (const item of ordersByStatus) {
      statusCounts[item._id] = item.count;
    }

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        suspended: suspendedUsers,
        sellers: totalSellers
      },
      catalog: {
        totalProducts,
        publishedProducts
      },
      orders: {
        totalOrders,
        statusBreakdown: statusCounts,
        totalGMV: Number((revenueResult[0]?.totalGMV || 0).toFixed(2))
      }
    };
  }

  /**
   * Audit log query viewer (ADM-FR-04)
   */
  async getAuditLogs(query) {
    return auditService.query(query, {
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 20
    });
  }
}

module.exports = new AdminService();
