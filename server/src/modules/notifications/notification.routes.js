const express = require('express');
const router = express.Router();
const notificationController = require('./notification.controller');
const requireAuth = require('../../middleware/auth');

// All notification routes are protected for authenticated users
router.use(requireAuth);

router.get('/', notificationController.getUserNotifications);
router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/:id/read', notificationController.markAsRead);

module.exports = router;
