const mongoose = require('mongoose');

/**
 * Review Model — SRS 5.2, REV-FR-01 to REV-FR-05 (Phase 3.2)
 *
 * Key design decisions:
 * - References productId, customerId, AND orderId (verified-purchase link)
 * - Unique compound index on { productId, customerId, orderId } prevents duplicate reviews
 * - Helpful/not-helpful voting tracked per-user to prevent abuse (REV-FR-04)
 * - Seller response embedded directly in the review document (REV-FR-05)
 * - Photo URLs stored as array (reuses S3 upload from 2.1.4)
 */

const sellerResponseSchema = new mongoose.Schema({
  body: {
    type: String,
    required: true,
    maxlength: 2000,
    trim: true
  },
  respondedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const reviewSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: 1,
    max: 5
  },
  title: {
    type: String,
    trim: true,
    maxlength: 200,
    default: ''
  },
  body: {
    type: String,
    required: [true, 'Review body is required'],
    trim: true,
    maxlength: 5000
  },
  photos: [{
    type: String // S3/R2 URLs
  }],
  isVerifiedPurchase: {
    type: Boolean,
    default: true
  },
  helpfulVotes: {
    type: Number,
    default: 0,
    min: 0
  },
  unhelpfulVotes: {
    type: Number,
    default: 0,
    min: 0
  },
  // Track which users have voted (prevent double-voting)
  voters: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    vote: {
      type: String,
      enum: ['helpful', 'unhelpful']
    }
  }],
  sellerResponse: {
    type: sellerResponseSchema,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'flagged', 'removed'],
    default: 'active',
    index: true
  }
}, {
  timestamps: true
});

// Prevent duplicate reviews: one review per customer per product per order
reviewSchema.index({ productId: 1, customerId: 1, orderId: 1 }, { unique: true });

// Compound index for listing reviews for a product (sorted by newest)
reviewSchema.index({ productId: 1, status: 1, createdAt: -1 });

// Index for customer's own reviews
reviewSchema.index({ customerId: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
