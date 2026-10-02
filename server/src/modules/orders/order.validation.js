const { z } = require('zod');

/**
 * Checkout payload validation (CART-FR-02)
 * Validates the client's checkout request before server-side price/stock re-verification
 */
const checkoutSchema = z.object({
  body: z.object({
    items: z.array(z.object({
      productId: z.string().min(1, 'Product ID is required'),
      sku: z.string().min(1, 'SKU is required'),
      qty: z.number().int().min(1).default(1)
    })).optional(),
    shippingAddress: z.object({
      fullName: z.string().trim().min(1, 'Full name is required').max(100),
      phone: z.string().trim().min(6, 'Phone is required').max(20),
      addressLine1: z.string().trim().min(1, 'Address line 1 is required').max(200),
      addressLine2: z.string().trim().max(200).optional().default(''),
      city: z.string().trim().min(1, 'City is required').max(100),
      state: z.string().trim().min(1, 'State is required').max(100),
      postalCode: z.string().trim().min(1, 'Postal code is required').max(20),
      country: z.string().trim().min(2).max(3).optional().default('IN')
    }).optional(),
    shippingAddressId: z.string().trim().min(1).optional(),
    idempotencyKey: z.string()
      .trim()
      .min(4, 'Idempotency key too short')
      .max(128, 'Idempotency key too long')
      .optional(),
    paymentMethod: z.enum(['stripe', 'razorpay', 'cod', 'stub', 'card', 'upi', 'netbanking']).optional().default('stub'),
    couponCode: z.string().trim().max(50).optional().nullable(),
    notes: z.string().trim().max(500).optional().default('')
  })
});

/**
 * Sub-order status update validation
 * Used by seller/admin to transition sub-order status
 */
const updateSubOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum([
      'confirmed', 'packed', 'shipped', 'delivered',
      'cancelled', 'return_requested', 'returned'
    ]),
    trackingNumber: z.string().trim().max(100).optional(),
    carrier: z.string().trim().max(100).optional(),
    reason: z.string().trim().max(500).optional()
  })
});

/**
 * Coupon validation schema (CART-FR-05)
 */
const applyCouponSchema = z.object({
  body: z.object({
    code: z.string().trim().min(1, 'Coupon code is required').max(50)
  })
});

/**
 * Order query/filter validation (for GET endpoints)
 */
const orderQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(10),
    status: z.enum([
      'pending', 'confirmed', 'packed', 'shipped', 'delivered',
      'cancelled', 'return_requested', 'returned'
    ]).optional()
  })
});

module.exports = {
  checkoutSchema,
  updateSubOrderStatusSchema,
  applyCouponSchema,
  orderQuerySchema
};
