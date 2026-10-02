const notificationService = require('./notification.service');
const { sendSuccess } = require('../../shared/response');

class NotificationController {
  /**
   * GET /api/v1/notifications
   * List notifications for logged-in user with unread count
   */
  async getUserNotifications(req, res, next) {
    try {
      const result = await notificationService.getUserNotifications(req.user._id, req.query);
      return sendSuccess(res, result.notifications, {
        unreadCount: result.unreadCount,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/notifications/:id/read
   * Mark a single notification as read
   */
  async markAsRead(req, res, next) {
    try {
      const notification = await notificationService.markAsRead(req.user._id, req.params.id);
      return sendSuccess(res, notification);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/notifications/read-all
   * Mark all notifications as read for current user
   */
  async markAllAsRead(req, res, next) {
    try {
      const result = await notificationService.markAllAsRead(req.user._id);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationController();
