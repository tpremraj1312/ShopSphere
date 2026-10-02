const { z } = require('zod');

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const addToCartSchema = z.object({
  body: z.object({
    productId: z.string().regex(objectIdRegex, 'Invalid Product ID format'),
    sku: z.string().optional(),
    qty: z.number().int().min(1, 'Quantity must be at least 1').default(1)
  })
});

const updateCartItemSchema = z.object({
  body: z.object({
    qty: z.number().int().min(0, 'Quantity must be at least 0')
  }),
  params: z.object({
    itemId: z.string().regex(objectIdRegex, 'Invalid Item ID format')
  })
});

const removeCartItemSchema = z.object({
  params: z.object({
    itemId: z.string().regex(objectIdRegex, 'Invalid Item ID format')
  })
});

const mergeCartSchema = z.object({
  body: z.object({
    guestId: z.string().min(1, 'guestId is required')
  })
});

module.exports = {
  addToCartSchema,
  updateCartItemSchema,
  removeCartItemSchema,
  mergeCartSchema
};
