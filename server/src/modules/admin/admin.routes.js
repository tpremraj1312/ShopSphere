const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const requireAuth = require('../../middleware/auth');
const requireRole = require('../../middleware/rbac');
const { requireStepUp } = require('../../middleware/stepUpAuth');

// All routes require authentication and admin or super_admin role
router.use(requireAuth);
router.use(requireRole('admin', 'super_admin'));

// Step-up Re-authentication (ADM-FR-05, SEC-06)
router.post('/step-up', adminController.verifyStepUp);

// Platform Metrics (ADM-FR-03)
router.get('/metrics', adminController.getMetrics);

// User Moderation (ADM-FR-01)
router.get('/users', adminController.listUsers);
router.post('/users/:id/suspend', requireStepUp, adminController.suspendUser);
router.post('/users/:id/reinstate', requireStepUp, adminController.reinstateUser);

// Listing Moderation (ADM-FR-02)
router.get('/products', adminController.listProducts);
router.patch('/products/:id/moderate', adminController.moderateProduct);

// Forced Refund (2.6.4, ADM-FR-05, SEC-21)
router.post('/orders/:id/refund', requireStepUp, adminController.forceRefund);

// Audit Log Viewer (ADM-FR-04, SEC-21)
router.get('/audit-logs', adminController.getAuditLogs);

module.exports = router;
