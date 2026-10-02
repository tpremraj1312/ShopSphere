/**
 * Order State Machine — SRS 5.3
 *
 * All order status transitions MUST go through this module.
 * No other code in the codebase should do `subOrder.status = X` directly.
 *
 * State flow:
 *   pending → confirmed → packed → shipped → delivered → [return_requested → returned]
 *                ↓
 *   pending → cancelled (customer or auto-timeout)
 *   confirmed → cancelled (customer)
 *   Any → refunded (admin only, always logged in AuditLog)
 *
 * Transition rules:
 *   pending → confirmed:       ONLY via verified payment webhook (PAY-FR-02)
 *   pending/confirmed → cancelled: customer-initiated or auto after 30min timeout
 *   packed → shipped:          seller-initiated, requires trackingNumber
 *   shipped → delivered:       seller/admin-marked (v1: no live carrier webhook)
 *   delivered → return_requested: customer within return window (default 7 days)
 *   return_requested → returned:  admin/seller approval
 *   Any → refunded:            admin-initiated, logged in AuditLog
 */

// Valid transitions: from → [to states]
const VALID_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['packed', 'cancelled'],
  packed: ['shipped'],
  shipped: ['delivered'],
  delivered: ['return_requested'],
  return_requested: ['returned'],
  returned: [],
  cancelled: []
};

// Who is allowed to trigger each transition
const TRANSITION_ACTORS = {
  'pending→confirmed': ['system'],            // Only payment webhook
  'pending→cancelled': ['customer', 'system', 'admin'],
  'confirmed→packed': ['seller'],
  'confirmed→cancelled': ['customer', 'admin'],
  'packed→shipped': ['seller'],
  'shipped→delivered': ['seller', 'admin'],
  'delivered→return_requested': ['customer'],
  'return_requested→returned': ['seller', 'admin']
};

// Transitions that require additional data
const TRANSITION_REQUIREMENTS = {
  'packed→shipped': ['trackingNumber'],
};

/**
 * Default return window in days.
 * delivered → return_requested is only valid within this window.
 */
const RETURN_WINDOW_DAYS = 7;

class OrderStateMachine {
  /**
   * Validate and execute a status transition on a sub-order.
   *
   * @param {Object} subOrder       - The sub-order document (from Order.subOrders)
   * @param {string} targetStatus   - The desired new status
   * @param {Object} options
   * @param {string} options.actor  - Role of the person/system making the change: 'customer' | 'seller' | 'admin' | 'system'
   * @param {string} options.actorId - The user ID or 'system' for automated transitions
   * @param {string} [options.reason] - Human-readable reason for the transition
   * @param {string} [options.trackingNumber] - Required for packed→shipped
   * @param {string} [options.carrier] - Optional carrier name for packed→shipped
   * @param {Date}   [options.deliveredAt] - When the order was delivered (for return window calc)
   * @returns {Object} The mutated sub-order (caller is responsible for saving the parent Order)
   * @throws {Error} If the transition is invalid
   */
  transition(subOrder, targetStatus, options = {}) {
    const { actor, actorId, reason, trackingNumber, carrier } = options;
    const currentStatus = subOrder.status;

    // 1. Check if the transition is structurally valid
    const allowedNext = VALID_TRANSITIONS[currentStatus];
    if (!allowedNext || !allowedNext.includes(targetStatus)) {
      const error = new Error(
        `Invalid status transition: '${currentStatus}' → '${targetStatus}'. ` +
        `Allowed transitions from '${currentStatus}': [${(allowedNext || []).join(', ')}]`
      );
      error.statusCode = 400;
      error.code = 'INVALID_STATE_TRANSITION';
      error.isOperational = true;
      throw error;
    }

    // 2. Check if the actor is authorized for this transition
    const transitionKey = `${currentStatus}→${targetStatus}`;
    const allowedActors = TRANSITION_ACTORS[transitionKey];
    if (allowedActors && actor && !allowedActors.includes(actor)) {
      const error = new Error(
        `Actor '${actor}' is not authorized for transition '${transitionKey}'. ` +
        `Allowed actors: [${allowedActors.join(', ')}]`
      );
      error.statusCode = 403;
      error.code = 'TRANSITION_UNAUTHORIZED';
      error.isOperational = true;
      throw error;
    }

    // 3. Check transition-specific requirements
    const requirements = TRANSITION_REQUIREMENTS[transitionKey];
    if (requirements) {
      for (const field of requirements) {
        if (field === 'trackingNumber' && !trackingNumber) {
          const error = new Error(`Transition '${transitionKey}' requires a tracking number`);
          error.statusCode = 400;
          error.code = 'MISSING_TRACKING_NUMBER';
          error.isOperational = true;
          throw error;
        }
      }
    }

    // 4. Special rule: return_requested only within the return window
    if (targetStatus === 'return_requested') {
      const deliveredAt = options.deliveredAt || this._findDeliveredDate(subOrder);
      if (deliveredAt) {
        const windowMs = RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000;
        const now = new Date();
        if (now - deliveredAt > windowMs) {
          const error = new Error(
            `Return window expired. Returns must be requested within ${RETURN_WINDOW_DAYS} days of delivery.`
          );
          error.statusCode = 400;
          error.code = 'RETURN_WINDOW_EXPIRED';
          error.isOperational = true;
          throw error;
        }
      }
    }

    // 5. Apply the transition
    const previousStatus = subOrder.status;
    subOrder.status = targetStatus;

    // Apply additional data
    if (trackingNumber) subOrder.trackingNumber = trackingNumber;
    if (carrier) subOrder.carrier = carrier;

    // Record in status history
    if (!subOrder.statusHistory) subOrder.statusHistory = [];
    subOrder.statusHistory.push({
      from: previousStatus,
      to: targetStatus,
      changedBy: actorId || null,
      reason: reason || null,
      changedAt: new Date()
    });

    return subOrder;
  }

  /**
   * Check if a transition is valid without executing it.
   */
  canTransition(currentStatus, targetStatus, actor = null) {
    const allowedNext = VALID_TRANSITIONS[currentStatus];
    if (!allowedNext || !allowedNext.includes(targetStatus)) return false;

    if (actor) {
      const transitionKey = `${currentStatus}→${targetStatus}`;
      const allowedActors = TRANSITION_ACTORS[transitionKey];
      if (allowedActors && !allowedActors.includes(actor)) return false;
    }

    return true;
  }

  /**
   * Get all possible next states from the current state.
   */
  getNextStates(currentStatus, actor = null) {
    const allowedNext = VALID_TRANSITIONS[currentStatus] || [];
    if (!actor) return allowedNext;

    return allowedNext.filter(target => {
      const transitionKey = `${currentStatus}→${target}`;
      const allowedActors = TRANSITION_ACTORS[transitionKey];
      return !allowedActors || allowedActors.includes(actor);
    });
  }

  /**
   * Get the list of all valid statuses.
   */
  getAllStatuses() {
    return Object.keys(VALID_TRANSITIONS);
  }

  /**
   * Find the delivered date from status history.
   * @private
   */
  _findDeliveredDate(subOrder) {
    if (!subOrder.statusHistory) return null;
    const entry = subOrder.statusHistory.find(h => h.to === 'delivered');
    return entry ? entry.changedAt : null;
  }
}

module.exports = new OrderStateMachine();
