const adminService = require('./admin.service');
const { sendSuccess } = require('../../shared/response');

/**
 * AdminController — Handles administrative HTTP requests (ADM-FR-01 to 05)
 */
const verifyStepUp = async (req, res, next) => {
  try {
    const { password, code } = req.body;
    const result = await adminService.verifyStepUp(req.user._id, { password, code }, req);
    return sendSuccess(res, result, null, 200);
  } catch (error) {
    next(error);
  }
};

const listUsers = async (req, res, next) => {
  try {
    const { page, limit, search, role, status } = req.query;
    const result = await adminService.listUsers({ page, limit, search, role, status });
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

const suspendUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const result = await adminService.suspendUser(id, reason, req);
    return sendSuccess(res, { message: 'User suspended successfully', ...result });
  } catch (error) {
    next(error);
  }
};

const reinstateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const result = await adminService.reinstateUser(id, reason, req);
    return sendSuccess(res, { message: 'User reinstated successfully', ...result });
  } catch (error) {
    next(error);
  }
};

const listProducts = async (req, res, next) => {
  try {
    const { page, limit, status, search } = req.query;
    const result = await adminService.listProductsForModeration({ page, limit, status, search });
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

const moderateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    const result = await adminService.moderateListing(id, { status, reason }, req);
    return sendSuccess(res, { message: `Product status updated to ${status}`, product: result });
  } catch (error) {
    next(error);
  }
};

const forceRefund = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason, subOrderId } = req.body;
    const result = await adminService.forceRefundOrder(id, { reason, subOrderId }, req);
    return sendSuccess(res, { message: 'Order refund processed and logged', order: result });
  } catch (error) {
    next(error);
  }
};

const getMetrics = async (req, res, next) => {
  try {
    const metrics = await adminService.getPlatformMetrics();
    return sendSuccess(res, metrics);
  } catch (error) {
    next(error);
  }
};

const getAuditLogs = async (req, res, next) => {
  try {
    const result = await adminService.getAuditLogs(req.query);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  verifyStepUp,
  listUsers,
  suspendUser,
  reinstateUser,
  listProducts,
  moderateProduct,
  forceRefund,
  getMetrics,
  getAuditLogs
};
