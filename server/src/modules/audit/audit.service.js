const AuditLog = require('./auditLog.model');

/**
 * AuditService — centralized audit logging for privileged admin actions (SEC-21)
 *
 * All admin-facing controllers call this service to record actions.
 * The service extracts IP/UA from the request and writes an append-only log entry.
 *
 * Usage:
 *   await auditService.log(req, {
 *     action: 'user.suspend',
 *     targetType: 'user',
 *     targetId: userId,
 *     details: { reason },
 *     previousState: { status: 'active' },
 *     newState: { status: 'suspended' }
 *   });
 */
class AuditService {
  /**
   * Write an audit log entry
   * @param {Object} req - Express request (for actor identity, IP, UA)
   * @param {Object} data - { action, targetType, targetId, details, previousState, newState }
   */
  async log(req, data) {
    const entry = new AuditLog({
      action: data.action,
      actorId: req.user._id,
      actorRole: req.user.role,
      targetType: data.targetType,
      targetId: data.targetId,
      details: data.details || {},
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent'],
      previousState: data.previousState,
      newState: data.newState
    });

    await entry.save();
    return entry;
  }

  /**
   * Query audit log entries with pagination and filters
   * @param {Object} filters - { action, actorId, targetType, targetId, startDate, endDate }
   * @param {Object} pagination - { page, limit }
   */
  async query(filters = {}, { page = 1, limit = 50 } = {}) {
    const query = {};

    if (filters.action) query.action = filters.action;
    if (filters.actorId) query.actorId = filters.actorId;
    if (filters.targetType) query.targetType = filters.targetType;
    if (filters.targetId) query.targetId = filters.targetId;

    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
    }

    const skip = (page - 1) * limit;
    const [entries, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('actorId', 'email role'),
      AuditLog.countDocuments(query)
    ]);

    return {
      entries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}

module.exports = new AuditService();
