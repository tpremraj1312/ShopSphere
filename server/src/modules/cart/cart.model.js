const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  sku: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  image: {
    type: String
  },
  qty: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
    default: 1
  },
  priceSnapshot: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: true });

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    sparse: true,
    index: true
  },
  guestId: {
    type: String,
    default: null,
    sparse: true,
    index: true
  },
  items: [cartItemSchema]
}, {
  timestamps: true
});

// TTL index for automatic guest cart cleanup after 30 days (CART-FR-01)
cartSchema.index(
  { updatedAt: 1 },
  {
    expireAfterSeconds: 30 * 24 * 60 * 60, // 30 days
    partialFilterExpression: { userId: null }
  }
);

module.exports = mongoose.model('Cart', cartSchema);
