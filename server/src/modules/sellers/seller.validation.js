const { z } = require('zod');

/**
 * Validation schema for Seller application (SELL-FR-01, Step 3.1.3)
 */
const applySellerSchema = z.object({
  body: z.object({
    storeName: z.string().min(2, 'Store name must be at least 2 characters').max(100),
    description: z.string().max(1000).optional(),
    phone: z.string().min(5, 'Valid phone number required'),
    businessAddress: z.object({
      street: z.string().min(1, 'Street is required'),
      city: z.string().min(1, 'City is required'),
      state: z.string().min(1, 'State is required'),
      postalCode: z.string().min(1, 'Postal code is required'),
      country: z.string().min(1, 'Country is required')
    }),
    taxId: z.string().max(50).optional()
  })
});

const sellerPhoneOtpSchema = z.object({
  body: z.object({
    phone: z.string().trim().min(7).max(20)
  })
});

const verifySellerPhoneSchema = z.object({
  body: z.object({
    otp: z.string().trim().regex(/^\d{6}$/, 'OTP must be 6 digits')
  })
});

/**
 * Validation schema for SKU inventory update (SELL-FR-03, Step 3.1.1)
 */
const updateStockSchema = z.object({
  body: z.object({
    productId: z.string().min(1, 'Product ID is required'),
    sku: z.string().min(1, 'SKU is required'),
    stock: z.number().int().min(0, 'Stock count must be a non-negative integer')
  })
});

/**
 * Validation schema for Seller Inventory Query
 */
const inventoryQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    lowStockOnly: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
    threshold: z.string().regex(/^\d+$/).transform(Number).optional()
  }).optional()
});

/**
 * Validation schema for Seller Sales Analytics (SELL-FR-04, Step 3.1.2)
 */
const analyticsQuerySchema = z.object({
  query: z.object({
    timeframe: z.enum(['7d', '30d', '90d', '1y']).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional()
  }).optional()
});

/**
 * Validation schema for CSV Bulk Product Upload (SELL-FR-05, Step 3.1.4)
 */
const bulkUploadSchema = z.object({
  body: z.object({
    csvData: z.string().min(1, 'CSV content is required')
  })
});

module.exports = {
  applySellerSchema,
  sellerPhoneOtpSchema,
  verifySellerPhoneSchema,
  updateStockSchema,
  inventoryQuerySchema,
  analyticsQuerySchema,
  bulkUploadSchema
};
