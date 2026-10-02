const mongoose = require('mongoose');

/**
 * AuditLog — append-only, immutable record of privileged admin actions (SRS 5.2, SEC-21)
 *
 * Design decisions:
 * - No updatedAt (timestamps: { updatedAt: false }) — entries are never modified
 * - TTL index disabled — logs must be retained for compliance review
 * - Compound index on (action + createdAt) for efficient time-range queries
 * - ipAddress + userAgent captured for forensic traceability
 */
const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'user.suspend',
      'user.reinstate',
      'listing.unpublish',
      'listing.republish',
      'order.force_refund',
      'payment.refund',
      'PAYMENT_REFUND',
      'admin.step_up_auth',
      'admin.2fa_setup',
      'admin.role_change',
      'admin.login',
      'system.security_event'
    ],
    index: true
  },
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  actorRole: { type: String, required: true },
  targetType: {
    type: String,
    required: true,
    enum: ['user', 'product', 'order', 'system']
  },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  details: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
  userAgent: { type: String },
  previousState: { type: mongoose.Schema.Types.Mixed },
  newState: { type: mongoose.Schema.Types.Mixed }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

// Compound index for time-range queries on specific actions
auditLogSchema.index({ action: 1, createdAt: -1 });
// Index for actor-based queries (who did what)
auditLogSchema.index({ actorId: 1, createdAt: -1 });
// Index for target-based queries (what happened to X)
auditLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
