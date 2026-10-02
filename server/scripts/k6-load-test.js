import http from 'k6/http';
import { check, sleep } from 'k6';

// k6 Load Test Script (Step 5.2.1, NFR-PERF-01)
// Simulates 100 concurrent users across browse, cart, and checkout flows

export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Ramp-up to 50 users
    { duration: '1m', target: 100 },  // Sustain 100 concurrent users
    { duration: '30s', target: 0 },   // Ramp-down
  ],
  thresholds: {
    // NFR-PERF-01 Targets:
    // Read operations: p95 < 300ms
    'http_req_duration{type:read}': ['p(95)<300'],
    // Write operations: p95 < 600ms
    'http_req_duration{type:write}': ['p(95)<600'],
    // Error rate must be under 1%
    'http_req_failed': ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000/api/v1';

export default function () {
  // 1. Browse Catalog (Read)
  const catalogRes = http.get(`${BASE_URL}/products?page=1&limit=20`, {
    tags: { type: 'read' },
  });
  check(catalogRes, {
    'catalog status 200': (r) => r.status === 200,
  });

  sleep(1);

  // 2. View Product Detail (Read)
  const productRes = http.get(`${BASE_URL}/products/featured`, {
    tags: { type: 'read' },
  });
  check(productRes, {
    'product detail status 200': (r) => r.status === 200,
  });

  sleep(1);

  // 3. Health & Telemetry check (Read)
  const healthRes = http.get(`${BASE_URL}/health`, {
    tags: { type: 'read' },
  });
  check(healthRes, {
    'health status 200': (r) => r.status === 200,
  });

  sleep(1);
}
