const mongoose = require('mongoose');
const Notification = require('./notification.model');
const User = require('../users/user.model');
const orderEvents = require('../orders/orderEvents');
const emailService = require('../../shared/email');
const smsProvider = require('../../shared/sms');

class NotificationService {
  constructor() {
    this._initializeEventListeners();
  }

  /**
   * Listen to decoupled order events (ORD-FR-03, Step 3.4.2 observer pattern)
   */
  _initializeEventListeners() {
    orderEvents.on('order:created', async ({ order }) => {
      try {
        await this.handleOrderCreated(order);
      } catch (err) {
        console.error('[NotificationService] Error handling order:created:', err.message);
      }
    });

    orderEvents.on('order:confirmed', async ({ order }) => {
      try {
        await this.handleOrderConfirmed(order);
      } catch (err) {
        console.error('[NotificationService] Error handling order:confirmed:', err.message);
      }
    });

    orderEvents.on('order:shipped', async ({ order, subOrder, extras }) => {
      try {
        await this.handleOrderShipped(order, subOrder, extras);
      } catch (err) {
        console.error('[NotificationService] Error handling order:shipped:', err.message);
      }
    });

    orderEvents.on('order:delivered', async ({ order, subOrder }) => {
      try {
        await this.handleOrderDelivered(order, subOrder);
      } catch (err) {
        console.error('[NotificationService] Error handling order:delivered:', err.message);
      }
    });

    orderEvents.on('order:cancelled', async ({ order, extras }) => {
      try {
        await this.handleOrderCancelled(order, extras?.reason);
      } catch (err) {
        console.error('[NotificationService] Error handling order:cancelled:', err.message);
      }
    });
  }

  async handleOrderCreated(order) {
    const orderIdStr = order._id.toString();

    // 1. Notify customer via Email & In-App Notification
    try {
      const customer = await User.findById(order.customerId).select('email name').lean();
      if (customer?.email) {
        await emailService.sendOrderConfirmedEmail(customer.email, order);
      }
      await this.createNotification({
        recipientId: order.customerId,
        type: 'order_confirmed',
        title: 'Order Placed Successfully',
        message: `Your order #${orderIdStr.slice(-6)} has been placed successfully and is being prepared.`,
        link: `/orders/${orderIdStr}`
      });
    } catch (custErr) {
      console.error('[NotificationService] Customer notification failed for order:created:', custErr.message);
    }

    // 2. Notify Sellers
    for (const subOrder of order.subOrders || []) {
      const seller = await User.findById(subOrder.sellerId).select('email').lean();
      if (!seller) continue;

      await this.createNotification({
        recipientId: seller._id,
        type: 'order_received',
        title: 'New order received',
        message: `Order #${orderIdStr.slice(-6)} contains ${subOrder.items?.length || 0} item line(s) and is ready for fulfillment.`,
        link: '/seller/orders'
      });

      if (seller.email) {
        await emailService.sendSellerOrderReceivedEmail(seller.email, order, subOrder);
      }
    }
  }

  /**
   * Order Confirmed Notification Handler
   */
  async handleOrderConfirmed(order) {
    const customerId = order.customerId;
    const user = await User.findById(customerId).lean();
    if (!user) return;

    const orderIdStr = order._id.toString();

    // 1. In-App Notification
    await this.createNotification({
      recipientId: customerId,
      type: 'order_confirmed',
      title: 'Order Confirmed',
      message: `Your order #${orderIdStr.slice(-6)} has been confirmed and is being prepared.`,
      link: `/orders/${orderIdStr}`
    });

    // 2. Transactional Email
    if (user.email) {
      await emailService.sendOrderConfirmedEmail(user.email, order);
    }
  }

  /**
   * Order Shipped Notification Handler
   */
  async handleOrderShipped(order, subOrder, extras = {}) {
    const customerId = order.customerId;
    const user = await User.findById(customerId).lean();
    if (!user) return;

    const orderIdStr = order._id.toString();
    const tracking = subOrder?.trackingNumber || extras?.trackingNumber || 'Available in order';

    // 1. In-App Notification
    await this.createNotification({
      recipientId: customerId,
      type: 'order_shipped',
      title: 'Order Dispatched',
      message: `Your package from order #${orderIdStr.slice(-6)} has shipped! Tracking: ${tracking}`,
      link: `/orders/${orderIdStr}`
    });

    // 2. Transactional Email
    if (user.email) {
      await emailService.sendOrderShippedEmail(user.email, order, subOrder || extras);
    }

    // 3. Optional SMS Dispatch (NOT-FR-03)
    if (user.phone) {
      await smsProvider.sendSms({
        to: user.phone,
        message: `ShopSphere: Your order #${orderIdStr.slice(-6)} has shipped! Tracking: ${tracking}`
      });
    }
  }

  /**
   * Order Delivered Notification Handler
   */
  async handleOrderDelivered(order, subOrder) {
    const customerId = order.customerId;
    const user = await User.findById(customerId).lean();
    if (!user) return;

    const orderIdStr = order._id.toString();

    // 1. In-App Notification
    await this.createNotification({
      recipientId: customerId,
      type: 'order_delivered',
      title: 'Package Delivered',
      message: `Order #${orderIdStr.slice(-6)} has been delivered. You can now leave a verified review!`,
      link: `/orders/${orderIdStr}`
    });

    // 2. Transactional Email
    if (user.email) {
      await emailService.sendOrderDeliveredEmail(user.email, order, subOrder);
    }
  }

  /**
   * Order Cancelled Notification Handler
   */
  async handleOrderCancelled(order, reason) {
    const customerId = order.customerId;
    const user = await User.findById(customerId).lean();
    if (!user) return;

    const orderIdStr = order._id.toString();

    // 1. In-App Notification
    await this.createNotification({
      recipientId: customerId,
      type: 'order_cancelled',
      title: 'Order Cancelled',
      message: `Order #${orderIdStr.slice(-6)} was cancelled. Reason: ${reason || 'Customer request'}.`,
      link: `/orders/${orderIdStr}`
    });

    // 2. Transactional Email
    if (user.email) {
      await emailService.sendOrderCancelledEmail(user.email, order, reason);
    }
  }

  /**
   * Create an in-app notification
   */
  async createNotification(data) {
    return await Notification.create({
      recipientId: data.recipientId,
      type: data.type || 'system',
      title: data.title,
      message: data.message,
      link: data.link || '',
      isRead: false
    });
  }

  /**
   * Get user notifications with unread count and pagination (NOT-FR-02)
   */
  async getUserNotifications(userId, options = {}) {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.max(1, Math.min(50, Number(options.limit) || 15));
    const recipientId = new mongoose.Types.ObjectId(userId.toString());

    const filter = { recipientId };
    if (options.unreadOnly === 'true' || options.unreadOnly === true) {
      filter.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipientId, isRead: false })
    ]);

    return {
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }

  /**
   * Mark a specific notification as read
   */
  async markAsRead(userId, notificationId) {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        recipientId: new mongoose.Types.ObjectId(userId.toString())
      },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      const error = new Error('Notification not found');
      error.statusCode = 404;
      error.code = 'NOTIFICATION_NOT_FOUND';
      throw error;
    }

    return notification;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId) {
    const result = await Notification.updateMany(
      {
        recipientId: new mongoose.Types.ObjectId(userId.toString()),
        isRead: false
      },
      { isRead: true }
    );

    return { updatedCount: result.modifiedCount };
  }
}

module.exports = new NotificationService();
