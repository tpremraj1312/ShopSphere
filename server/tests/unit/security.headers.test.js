const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../../src/app');

/**
 * Security Headers & Configuration Verification Test (SEC-11, SEC-12, SEC-13)
 */
describe('Security Headers Verification (SEC-11, SEC-12, SEC-13)', () => {
  it('SEC-13: should include strict Helmet security headers (CSP, frameguard, nosniff, referrer-policy)', async () => {
    // Simulate a request to health check
    const mockReq = {
      method: 'GET',
      url: '/api/v1/health',
      headers: {},
      rawBody: Buffer.from(''),
      connection: { remoteAddress: '127.0.0.1' },
      socket: { remoteAddress: '127.0.0.1' },
      get: (header) => mockReq.headers[header.toLowerCase()],
    };

    const headers = {};
    let resolved = false;
    let finishPromise;
    const promise = new Promise((resolve) => { finishPromise = resolve; });

    const done = () => {
      if (!resolved) {
        resolved = true;
        finishPromise();
      }
    };

    const mockRes = {
      statusCode: 200,
      setHeader: (key, val) => {
        headers[key.toLowerCase()] = val;
      },
      getHeader: (key) => headers[key.toLowerCase()],
      removeHeader: (key) => {
        delete headers[key.toLowerCase()];
      },
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.body = data;
        done();
        return this;
      },
      send(data) {
        this.body = data;
        done();
        return this;
      },
      end() {
        done();
      }
    };

    // Invoke the express app directly or through route handler
    app.handle(mockReq, mockRes, () => done());
    await promise;

    // Verify Helmet headers
    assert.strictEqual(headers['x-frame-options'], 'DENY', 'X-Frame-Options must be DENY (clickjacking protection)');
    assert.strictEqual(headers['x-content-type-options'], 'nosniff', 'X-Content-Type-Options must be nosniff');
    assert.ok(headers['content-security-policy'], 'Content-Security-Policy header must be present');
    assert.ok(headers['content-security-policy'].includes("default-src 'self'"), 'CSP must restrict default-src to self');
    assert.strictEqual(headers['x-powered-by'], undefined, 'X-Powered-By must be removed to avoid tech disclosure');
    assert.ok(headers['strict-transport-security'], 'HSTS header must be present');
    assert.ok(headers['strict-transport-security'].includes('max-age=31536000'), 'HSTS max-age must be 1 year');
    assert.ok(headers['strict-transport-security'].includes('includeSubDomains'), 'HSTS must include subdomains');
  });

  it('SEC-12: should enforce CORS allowlist and reject untrusted origins', async () => {
    const mockReq = {
      method: 'OPTIONS',
      url: '/api/v1/health',
      headers: {
        origin: 'https://evil-attacker.com',
        'access-control-request-method': 'GET'
      },
      rawBody: Buffer.from(''),
      connection: { remoteAddress: '127.0.0.1' },
      socket: { remoteAddress: '127.0.0.1' },
      get: (header) => mockReq.headers[header.toLowerCase()],
    };

    let resolved = false;
    let finishResolve;
    const promise = new Promise((resolve) => { finishResolve = resolve; });

    const mockRes = {
      statusCode: 200,
      headers: {},
      setHeader: function(k, v) { this.headers[k.toLowerCase()] = v; },
      getHeader: function(k) { return this.headers[k.toLowerCase()]; },
      removeHeader: function(k) { delete this.headers[k.toLowerCase()]; },
      status: function(code) { this.statusCode = code; return this; },
      json: function(data) {
        this.body = data;
        if (!resolved) { resolved = true; finishResolve(); }
        return this;
      },
      send: function(data) {
        this.body = data;
        if (!resolved) { resolved = true; finishResolve(); }
        return this;
      },
      end: function() {
        if (!resolved) { resolved = true; finishResolve(); }
      }
    };

    app.handle(mockReq, mockRes, (err) => {
      if (err) mockRes.status(500).json({ error: err.message });
      if (!resolved) { resolved = true; finishResolve(); }
    });

    await promise;

    // The CORS rejected request should either return a 500 error from errorHandler or not set Allow-Origin
    assert.ok(mockRes.statusCode >= 400 || mockRes.headers['access-control-allow-origin'] === undefined);
    assert.strictEqual(mockRes.headers['access-control-allow-origin'], undefined, 'Untrusted origin must not receive Access-Control-Allow-Origin');
  });

  it('SEC-12: should allow trusted origin specified in configuration', async () => {
    const trustedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
    const headers = {};
    const mockReq = {
      method: 'OPTIONS',
      url: '/api/v1/health',
      headers: {
        origin: trustedOrigin,
        'access-control-request-method': 'GET'
      },
      rawBody: Buffer.from(''),
      connection: { remoteAddress: '127.0.0.1' },
      socket: { remoteAddress: '127.0.0.1' },
      get: (header) => mockReq.headers[header.toLowerCase()],
    };

    let finished = false;
    let resolvePromise;
    const promise = new Promise((resolve) => { resolvePromise = resolve; });

    const done = () => {
      if (!finished) {
        finished = true;
        resolvePromise();
      }
    };

    const mockRes = {
      statusCode: 200,
      setHeader: (key, val) => {
        headers[key.toLowerCase()] = val;
      },
      getHeader: (key) => headers[key.toLowerCase()],
      removeHeader: () => {},
      status(code) { this.statusCode = code; return this; },
      json(data) { this.body = data; done(); return this; },
      send(data) { this.body = data; done(); return this; },
      end() { done(); }
    };

    let caughtError = null;
    app.handle(mockReq, mockRes, (err) => {
      caughtError = err;
      done();
    });

    await promise;

    assert.strictEqual(caughtError, null, 'Trusted origin must not produce a CORS error');
    assert.strictEqual(headers['access-control-allow-origin'], trustedOrigin, 'CORS must reflect allowed origin');
    assert.strictEqual(headers['access-control-allow-credentials'], 'true', 'Credentials must be allowed for trusted origin');
  });
});
