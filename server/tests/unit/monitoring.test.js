const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { metrics, captureException, sanitizeContext } = require('../../src/shared/monitoring');
const alertManager = require('../../src/shared/alertManager');

describe('Monitoring, Observability & Alerting (Phase 4.3)', () => {
  describe('Metrics Collection & Latency Percentiles (4.3.2)', () => {
    it('records requests, status codes, and computes latency percentiles', () => {
      // Record 100 sample requests with varying latencies
      for (let i = 1; i <= 100; i++) {
        metrics.recordRequest('GET', '/api/v1/products', i % 10 === 0 ? 500 : 200, i * 2);
      }

      const snapshot = metrics.getSnapshot();
      assert.ok(snapshot.totalRequests >= 100);
      assert.ok(snapshot.totalErrors >= 10);
      assert.ok(snapshot.errorRatePercent > 0);
      assert.ok(snapshot.latency.p50Ms > 0);
      assert.ok(snapshot.latency.p95Ms >= snapshot.latency.p50Ms);
      assert.ok(snapshot.latency.p99Ms >= snapshot.latency.p95Ms);
    });

    it('generates valid Prometheus exposition format', () => {
      const promText = metrics.toPrometheusFormat();
      assert.ok(promText.includes('http_requests_total'));
      assert.ok(promText.includes('http_errors_total'));
      assert.ok(promText.includes('http_request_latency_ms{quantile="0.5"}'));
      assert.ok(promText.includes('http_request_latency_ms{quantile="0.95"}'));
    });
  });

  describe('Alert Rules Evaluation (4.3.3)', () => {
    it('triggers ALERT_HIGH_ERROR_RATE when error rate exceeds 5%', () => {
      const mockSnapshot = {
        totalRequests: 100,
        totalErrors: 15,
        errorRatePercent: 15.0, // > 5.0%
        authFailures: 2,
        paymentWebhook: { failures: 0, failureRatePercent: 0 }
      };

      const alerts = alertManager.evaluate(mockSnapshot);
      const errorSpike = alerts.find(a => a.id === 'ALERT_HIGH_ERROR_RATE');
      assert.ok(errorSpike, 'High error rate alert must be triggered');
      assert.strictEqual(errorSpike.severity, 'CRITICAL');
    });

    it('triggers ALERT_PAYMENT_WEBHOOK_FAILURES on repeated webhook failures', () => {
      const mockSnapshot = {
        totalRequests: 50,
        totalErrors: 2,
        errorRatePercent: 4.0,
        authFailures: 1,
        paymentWebhook: { failures: 4, failureRatePercent: 25.0 }
      };

      const alerts = alertManager.evaluate(mockSnapshot);
      const webhookAlert = alerts.find(a => a.id === 'ALERT_PAYMENT_WEBHOOK_FAILURES');
      assert.ok(webhookAlert, 'Payment webhook failure alert must be triggered');
      assert.strictEqual(webhookAlert.severity, 'HIGH');
    });

    it('triggers ALERT_AUTH_FAILURE_SPIKE on brute force spike', () => {
      const mockSnapshot = {
        totalRequests: 50,
        totalErrors: 2,
        errorRatePercent: 4.0,
        authFailures: 12, // >= 10
        paymentWebhook: { failures: 0, failureRatePercent: 0 }
      };

      const alerts = alertManager.evaluate(mockSnapshot);
      const authAlert = alerts.find(a => a.id === 'ALERT_AUTH_FAILURE_SPIKE');
      assert.ok(authAlert, 'Auth failure spike alert must be triggered');
      assert.strictEqual(authAlert.severity, 'HIGH');
    });
  });

  describe('Sentry Integration & PII Sanitization (4.3.1 Acceptance Check)', () => {
    it('sanitizes passwords, secrets, tokens, and credit card numbers from error context', () => {
      const rawPayload = {
        email: 'customer@example.com',
        password: 'SuperSecretPassword123!',
        userToken: 'eyJhbGciOiJIUzI1NiIsIn...',
        twoFactorSecret: 'JBSWY3DPEHPK3PXP',
        payment: {
          creditCard: '4111222233334444',
          cvv: '123'
        },
        metadata: {
          browser: 'Chrome'
        }
      };

      const sanitized = sanitizeContext(rawPayload);
      assert.strictEqual(sanitized.email, 'customer@example.com');
      assert.strictEqual(sanitized.password, '[REDACTED]');
      assert.strictEqual(sanitized.userToken, '[REDACTED]');
      assert.strictEqual(sanitized.twoFactorSecret, '[REDACTED]');
      assert.strictEqual(sanitized.payment.creditCard, '[REDACTED]');
      assert.strictEqual(sanitized.payment.cvv, '[REDACTED]');
      assert.strictEqual(sanitized.metadata.browser, 'Chrome');
    });

    it('captures exception with useful stack trace without leaking PII', () => {
      const testError = new Error('Database connection reset during checkout');
      testError.code = 'ECONNRESET';

      const captured = captureException(testError, {
        userId: 'user_123',
        attemptedPassword: 'PlainTextPassword!',
        token: 'secret_jwt_token'
      });

      assert.strictEqual(captured.message, 'Database connection reset during checkout');
      assert.strictEqual(captured.code, 'ECONNRESET');
      assert.ok(captured.stack.includes('Database connection reset'));
      assert.strictEqual(captured.context.userId, 'user_123');
      assert.strictEqual(captured.context.attemptedPassword, '[REDACTED]');
      assert.strictEqual(captured.context.token, '[REDACTED]');
    });
  });
});
