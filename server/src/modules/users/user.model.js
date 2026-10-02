const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  name: String,
  phone: String,
  street: String,
  city: String,
  state: String,
  postalCode: String,
  country: String,
  isDefault: { type: Boolean, default: false }
});

const sellerProfileSchema = new mongoose.Schema({
  storeName: { type: String, trim: true },
  description: { type: String, trim: true },
  phone: { type: String, trim: true },
  businessAddress: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  taxId: { type: String, trim: true },
  phoneVerified: { type: Boolean, default: false },
  phoneOtpHash: { type: String },
  phoneOtpExpiresAt: { type: Date },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
  appliedAt: { type: Date, default: Date.now },
  approvedAt: { type: Date }
}, { _id: false });

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String },
  role: { type: String, enum: ['customer', 'seller', 'admin', 'super_admin'], default: 'customer' },
  emailVerified: { type: Boolean, default: false },
  oauthProviders: [{
    provider: String,
    providerId: String
  }],
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String },
  twoFactorRecoveryCodes: [String],
  twoFactorPending: { type: Boolean, default: false },
  verificationToken: { type: String },
  verificationTokenExpires: { type: Date },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  phoneVerified: { type: Boolean, default: false },
  phoneOtpHash: { type: String },
  phoneOtpExpiresAt: { type: Date },
  addresses: [addressSchema],
  sellerProfile: sellerProfileSchema,
  status: { type: String, enum: ['active', 'suspended'], default: 'active' }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
