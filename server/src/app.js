const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const securityLogger = require('./shared/securityLogger');

// Routes
const authRoutes = require('./modules/auth/auth.routes');
const productRoutes = require('./modules/products/product.routes');
const cartRoutes = require('./modules/cart/cart.routes');
const orderRoutes = require('./modules/orders/order.routes');
const userRoutes = require('./modules/users/user.routes');
const paymentRoutes = require('./modules/payments/payment.routes');
const sellerRoutes = require('./modules/sellers/seller.routes');
const reviewRoutes = require('./modules/reviews/review.routes');
const notificationRoutes = require('./modules/notifications/notification.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const shareRoutes = require('./modules/share/share.routes');

const app = express();

// ---------------------------------------------------------------------------
// Security Middleware (SEC-11, SEC-12, SEC-13)
// ---------------------------------------------------------------------------

// SEC-13: Helmet with hardened Content-Security-Policy, X-Frame-Options,
//         X-Content-Type-Options, and Referrer-Policy headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.CLIENT_URL || 'http://localhost:5173'],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  // SEC-11: HSTS — Strict Transport Security (1 year, includeSubDomains, preload)
  strictTransportSecurity: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true,
  },
  // X-Frame-Options: DENY (clickjacking protection)
  frameguard: { action: 'deny' },
  // X-Content-Type-Options: nosniff
  noSniff: true,
  // Referrer-Policy
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  // Hide X-Powered-By
  hidePoweredBy: true,
}));

// SEC-12: CORS — allowlist from environment, no wildcard on authenticated routes
const allowedOrigins = (process.env.CORS_ORIGINS || process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, server-to-server, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    securityLogger.warn('CORS_REJECTED', { blockedOrigin: origin });
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Step-Up-Token'],
  maxAge: 86400, // Preflight cache 24h
}));

app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(morgan('dev'));
app.use('/api/', apiLimiter); // Apply generic API limiter to /api routes

const { metricsMiddleware, metrics } = require('./shared/monitoring');
const alertManager = require('./shared/alertManager');

app.use(metricsMiddleware);

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/seller', sellerRoutes);
app.use('/api/v1/sellers', sellerRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/share', shareRoutes);
app.use('/s', shareRoutes);
app.use('/api/v1', orderRoutes); // Mounts /checkout, /orders, /seller/orders

// Health check
app.get('/api/v1/health', (req, res) => {
  const { sendSuccess } = require('./shared/response');
  sendSuccess(res, { status: "ok" });
});

// Telemetry & Metrics (4.3.2)
app.get('/api/v1/metrics', (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send(metrics.toPrometheusFormat());
});

app.get('/api/v1/admin/telemetry/metrics', (req, res) => {
  const snapshot = metrics.getSnapshot();
  const alerts = alertManager.evaluate(snapshot);
  const { sendSuccess } = require('./shared/response');
  sendSuccess(res, {
    metrics: snapshot,
    activeAlerts: alerts,
    alertHistory: alertManager.getAlertHistory()
  });
});

// Error handling - MUST be the last middleware
app.use(errorHandler);

module.exports = app;
