const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const notificationService = require('../../src/modules/notifications/notification.service');
const Notification = require('../../src/modules/notifications/notification.model');
const User = require('../../src/modules/users/user.model');
const orderEvents = require('../../src/modules/orders/orderEvents');
const smsProvider = require('../../src/shared/sms');
const emailProvider = require('../../src/shared/email');

describe('Notification Service & Observer Event Triggers (Step 3.4, NOT-FR-01 to 03)', () => {
  const userId = new mongoose.Types.ObjectId();
  const orderId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    User.findById = () => ({
      lean: async () => ({
        _id: userId,
        email: 'customer@test.com',
        phone: '+15551234567'
      })
    });

    Notification.create = async (doc) => ({
      _id: new mongoose.Types.ObjectId(),
      isRead: false,
      ...doc
    });

    Notification.find = () => ({
      sort: () => ({
        skip: () => ({
          limit: () => ({
            lean: async () => [
              { _id: new mongoose.Types.ObjectId(), title: 'Order Confirmed', isRead: false }
            ]
          })
        })
      })
    });

    Notification.countDocuments = async () => 1;
    Notification.findOneAndUpdate = async (q, update) => ({ _id: q._id, ...update });
    Notification.updateMany = async () => ({ modifiedCount: 3 });
  });

  test('order:confirmed event triggers in-app notification and email (Step 3.4 Acceptance Check)', async () => {
    let createdNotification = null;
    let emailSent = false;

    Notification.create = async (doc) => {
      createdNotification = doc;
      return { _id: new mongoose.Types.ObjectId(), ...doc };
    };

    const originalSendConfirmed = emailProvider.sendOrderConfirmedEmail;
    emailProvider.sendOrderConfirmedEmail = async (email, order) => {
      emailSent = true;
      assert.strictEqual(email, 'customer@test.com');
      return { success: true };
    };

    try {
      const mockOrder = {
        _id: orderId,
        customerId: userId,
        pricing: { total: 89.99 }
      };

      orderEvents.emit('order:confirmed', { order: mockOrder });

      // Small async tick for event listener
      await new Promise((resolve) => setTimeout(resolve, 50));

      assert.ok(createdNotification);
      assert.strictEqual(createdNotification.type, 'order_confirmed');
      assert.strictEqual(createdNotification.recipientId.toString(), userId.toString());
      assert.strictEqual(emailSent, true);
    } finally {
      emailProvider.sendOrderConfirmedEmail = originalSendConfirmed;
    }
  });

  test('order:shipped event triggers in-app notification, email, and SMS with tracking (Step 3.4 Acceptance Check)', async () => {
    let createdNotification = null;
    let emailSent = false;
    let smsSent = false;

    Notification.create = async (doc) => {
      createdNotification = doc;
      return { _id: new mongoose.Types.ObjectId(), ...doc };
    };

    const originalSendShipped = emailProvider.sendOrderShippedEmail;
    const originalSendSms = smsProvider.sendSms;

    emailProvider.sendOrderShippedEmail = async () => { emailSent = true; return { success: true }; };
    smsProvider.sendSms = async ({ to, message }) => {
      smsSent = true;
      assert.strictEqual(to, '+15551234567');
      assert.ok(message.includes('TRACK-12345'));
      return { success: true };
    };

    try {
      const mockOrder = {
        _id: orderId,
        customerId: userId,
        pricing: { total: 89.99 }
      };

      const mockSubOrder = {
        trackingNumber: 'TRACK-12345',
        carrier: 'FedEx'
      };

      orderEvents.emit('order:shipped', { order: mockOrder, subOrder: mockSubOrder });

      await new Promise((resolve) => setTimeout(resolve, 50));

      assert.ok(createdNotification);
      assert.strictEqual(createdNotification.type, 'order_shipped');
      assert.ok(createdNotification.message.includes('TRACK-12345'));
      assert.strictEqual(emailSent, true);
      assert.strictEqual(smsSent, true);
    } finally {
      emailProvider.sendOrderShippedEmail = originalSendShipped;
      smsProvider.sendSms = originalSendSms;
    }
  });

  test('getUserNotifications returns paginated list with unreadCount (NOT-FR-02)', async () => {
    const res = await notificationService.getUserNotifications(userId, { page: 1, limit: 10 });
    assert.strictEqual(res.notifications.length, 1);
    assert.strictEqual(res.unreadCount, 1);
    assert.strictEqual(res.pagination.page, 1);
  });

  test('markAsRead marks notification as read (NOT-FR-02)', async () => {
    const notifId = new mongoose.Types.ObjectId();
    const res = await notificationService.markAsRead(userId, notifId);
    assert.strictEqual(res.isRead, true);
  });

  test('markAllAsRead marks all user notifications as read', async () => {
    const res = await notificationService.markAllAsRead(userId);
    assert.strictEqual(res.updatedCount, 3);
  });

  test('smsProvider sends SMS in sandbox mode when credentials not set (NOT-FR-03)', async () => {
    const res = await smsProvider.sendSms({
      to: '+15551234567',
      message: 'ShopSphere: Order delivered!'
    });
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.sandbox, true);
  });
});
