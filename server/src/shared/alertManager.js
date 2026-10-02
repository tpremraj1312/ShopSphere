/**
 * alertManager.js — Threshold-based Alerting Rules (4.3.3)
 *
 * Implements real-time evaluation of:
 * - Error-rate spike (errorRate > 5%)
 * - Payment webhook failure rate (failureRate > 10% or >= 3 failures)
 * - Auth failure spike (authFailures > 10 in window)
 */

class AlertManager {
  constructor() {
    this.activeAlerts = [];
    this.alertHistory = [];
  }

  evaluate(metricsSnapshot) {
    const alerts = [];

    // Rule 1: Error-rate spike
    if (metricsSnapshot.totalRequests >= 20 && metricsSnapshot.errorRatePercent > 5.0) {
      alerts.push({
        id: 'ALERT_HIGH_ERROR_RATE',
        severity: 'CRITICAL',
        title: 'Error Rate Spike Detected',
        message: `HTTP error rate reached ${metricsSnapshot.errorRatePercent}% (threshold: 5.0%) across ${metricsSnapshot.totalRequests} requests.`,
        triggeredAt: new Date().toISOString(),
      });
    }

    // Rule 2: Payment webhook failure rate
    if (metricsSnapshot.paymentWebhook.failures >= 3 || metricsSnapshot.paymentWebhook.failureRatePercent > 10.0) {
      alerts.push({
        id: 'ALERT_PAYMENT_WEBHOOK_FAILURES',
        severity: 'HIGH',
        title: 'Payment Webhook Failure Spike',
        message: `${metricsSnapshot.paymentWebhook.failures} payment webhooks failed (${metricsSnapshot.paymentWebhook.failureRatePercent}% failure rate).`,
        triggeredAt: new Date().toISOString(),
      });
    }

    // Rule 3: Auth failure spike (credential stuffing / brute force indicator)
    if (metricsSnapshot.authFailures >= 10) {
      alerts.push({
        id: 'ALERT_AUTH_FAILURE_SPIKE',
        severity: 'HIGH',
        title: 'Authentication Failure Spike',
        message: `${metricsSnapshot.authFailures} authentication failures recorded. Possible brute force or credential stuffing attempt.`,
        triggeredAt: new Date().toISOString(),
      });
    }

    this.activeAlerts = alerts;
    if (alerts.length > 0) {
      alerts.forEach(a => {
        if (!this.alertHistory.some(h => h.id === a.id && Date.now() - new Date(h.triggeredAt).getTime() < 300000)) {
          this.alertHistory.unshift(a);
          console.warn(`[ALERT:${a.severity}] ${a.title}: ${a.message}`);
        }
      });
    }

    return alerts;
  }

  getActiveAlerts() {
    return this.activeAlerts;
  }

  getAlertHistory() {
    return this.alertHistory.slice(0, 50);
  }
}

module.exports = new AlertManager();
