/**
 * securityLogger.js — Centralized security event logging (SEC-22, 4.3.1)
 *
 * Captures auth failures, rate-limit trips, 403s, CORS rejections, and
 * suspicious activity into structured JSON logs. In production this would
 * integrate with Sentry/Datadog/etc. — the abstraction exists so that
 * wiring a real provider requires zero changes to consuming code.
 *
 * Events are written to both console (structured JSON) and optionally
 * to a security events collection in MongoDB for dashboarding.
 */

const SEVERITY = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  CRITICAL: 'CRITICAL',
};

/**
 * Structured security event — formatted for log ingestion pipelines
 */
function createEvent(severity, eventType, details = {}, req = null) {
  const event = {
    timestamp: new Date().toISOString(),
    severity,
    event: eventType,
    ...details,
  };

  // Attach request context if available
  if (req) {
    event.ip = req.ip || req.connection?.remoteAddress;
    event.userAgent = req.get?.('User-Agent');
    event.method = req.method;
    event.url = req.originalUrl;
    event.userId = req.user?.userId || null;
  }

  return event;
}

const securityLogger = {
  /**
   * Log informational security event (successful admin login, 2FA setup, etc.)
   */
  info(eventType, details = {}, req = null) {
    const event = createEvent(SEVERITY.INFO, eventType, details, req);
    console.log('[SECURITY:INFO]', JSON.stringify(event));
    return event;
  },

  /**
   * Log warning-level security event (CORS rejection, auth failure, etc.)
   */
  warn(eventType, details = {}, req = null) {
    const event = createEvent(SEVERITY.WARN, eventType, details, req);
    console.warn('[SECURITY:WARN]', JSON.stringify(event));
    return event;
  },

  /**
   * Log error-level security event (repeated auth failures, IDOR attempt, etc.)
   */
  error(eventType, details = {}, req = null) {
    const event = createEvent(SEVERITY.ERROR, eventType, details, req);
    console.error('[SECURITY:ERROR]', JSON.stringify(event));
    return event;
  },

  /**
   * Log critical security event (brute force detected, data breach indicator, etc.)
   */
  critical(eventType, details = {}, req = null) {
    const event = createEvent(SEVERITY.CRITICAL, eventType, details, req);
    console.error('[SECURITY:CRITICAL]', JSON.stringify(event));
    // In production, this would trigger an immediate alert (PagerDuty, Sentry, etc.)
    return event;
  },

  /**
   * Log an authentication failure (SEC-22)
   */
  authFailure(reason, req) {
    return this.warn('AUTH_FAILURE', { reason }, req);
  },

  /**
   * Log a rate limit trip (SEC-22)
   */
  rateLimitTrip(req) {
    return this.warn('RATE_LIMIT_TRIP', {}, req);
  },

  /**
   * Log a 403 Forbidden access attempt (SEC-22)
   */
  forbiddenAccess(reason, req) {
    return this.warn('FORBIDDEN_ACCESS', { reason }, req);
  },

  /**
   * Log a suspicious IDOR attempt (SEC-04)
   */
  idorAttempt(resourceType, resourceId, req) {
    return this.error('IDOR_ATTEMPT', { resourceType, resourceId }, req);
  },
};

module.exports = securityLogger;
