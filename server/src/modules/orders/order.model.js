const mongoose = require('mongoose');

/**
 * Order Model — SRS 5.2 Order Schema
 *
 * Key design decisions:
 * - Item prices are SNAPSHOTTED at order-creation time (never re-read from Product)
 * - Shipping address is an embedded snapshot (not a live User.addresses reference)
 * - subOrders group items by sellerId for multi-seller fulfillment (ORD-FR-05)
 * - idempotencyKey prevents duplicate order creation (CART-FR-06)
 * - pricing is computed server-side and immutable after creation
 */

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  sku: { type: String, required: true },
  title: { type: String, required: true },
  unitPrice: { type: Number, required: true, min: 0 },
  qty: { type: Number, required: true, min: 1 },
  image: { type: String, default: '' }
}, { _id: false });

const subOrderSchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  items: {
    type: [orderItemSchema],
    required: true,
    validate: [arr => arr.length > 0, 'Sub-order must have at least one item']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'return_requested', 'returned'],
    default: 'pending'
  },
  trackingNumber: { type: String, default: null },
  carrier: { type: String, default: null },
  statusHistory: [{
    from: String,
    to: String,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: String,
    changedAt: { type: Date, default: Date.now }
  }]
}, { _id: true });

const shippingAddressSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  addressLine1: { type: String, required: true },
  addressLine2: { type: String, default: '' },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true, default: 'IN' }
}, { _id: false });

const pricingSchema = new mongoose.Schema({
  subtotal: { type: Number, required: true, min: 0 },
  tax: { type: Number, required: true, default: 0, min: 0 },
  shipping: { type: Number, required: true, default: 0, min: 0 },
  discount: { type: Number, required: true, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 }
}, { _id: false });

const paymentSchema = new mongoose.Schema({
  provider: {
    type: String,
    enum: ['stripe', 'razorpay', 'cod', 'stub'],
    default: 'stub'
  },
  providerPaymentId: { type: String, default: null },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending'
  },
  method: { type: String, default: null }, // card, upi, netbanking, etc.
  paidAt: { type: Date, default: null }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  subOrders: {
    type: [subOrderSchema],
    required: true,
    validate: [arr => arr.length > 0, 'Order must have at least one sub-order']
  },
  shippingAddress: {
    type: shippingAddressSchema,
    required: true
  },
  pricing: {
    type: pricingSchema,
    required: true
  },
  currency: {
    type: String,
    enum: ['INR'],
    default: 'INR'
  },
  payment: {
    type: paymentSchema,
    default: () => ({})
  },
  idempotencyKey: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  couponCode: { type: String, default: null },
  notes: { type: String, default: '' }
}, {
  timestamps: true
});

// Compound index for customer order history (sorted by newest first)
orderSchema.index({ customerId: 1, createdAt: -1 });

// Index for seller order lookups
orderSchema.index({ 'subOrders.sellerId': 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
