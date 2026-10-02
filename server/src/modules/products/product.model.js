const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  sku: { type: String, required: true },
  attributes: {
    type: Map,
    of: String,
    default: {}
  },
  price: { type: Number, required: true, min: 0 },
  stock: { type: Number, required: true, min: 0, default: 0 },
  images: [{ type: String }]
}, { _id: true });

const productSchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Product title is required'],
    trim: true,
    maxlength: 200
  },
  brand: {
    type: String,
    trim: true,
    index: true
  },
  specs: {
    type: Map,
    of: String,
    default: {}
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true
  },
  category: {
    l1: { type: String, required: true, trim: true },
    l2: { type: String, required: true, trim: true },
    l3: { type: String, trim: true }
  },
  basePrice: {
    type: Number,
    required: [true, 'Base price is required'],
    min: 0
  },
  currency: {
    type: String,
    default: 'INR',
    uppercase: true
  },
  variants: [variantSchema],
  images: [{ type: String }],
  ratingAvg: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  ratingCount: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'unpublished'],
    default: 'published',
    index: true
  },
  searchKeywords: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Compound index for filtered category catalog browse
productSchema.index({
  'category.l1': 1,
  'category.l2': 1,
  status: 1,
  ratingAvg: -1
});

// Compound index for seller product lists
productSchema.index({
  sellerId: 1,
  createdAt: -1
});

// Text index for title + search keywords discovery
productSchema.index({
  title: 'text',
  searchKeywords: 'text'
});

module.exports = mongoose.model('Product', productSchema);
