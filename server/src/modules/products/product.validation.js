const { z } = require('zod');

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const variantSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  attributes: z.record(z.string(), z.string()).optional().default({}),
  price: z.number().min(0, 'Price must be non-negative'),
  stock: z.number().int().min(0, 'Stock must be a non-negative integer').default(0),
  images: z.array(z.string()).optional().default([])
});

const createProductSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters long').max(200),
    description: z.string().min(10, 'Description must be at least 10 characters long'),
    category: z.object({
      l1: z.string().min(1, 'Top level category is required'),
      l2: z.string().min(1, 'Subcategory is required'),
      l3: z.string().optional()
    }),
    basePrice: z.number().min(0, 'Base price must be non-negative'),
    currency: z.string().length(3).optional().default('INR'),
    variants: z.array(variantSchema).optional().default([]),
    status: z.enum(['draft', 'published', 'unpublished']).optional().default('published'),
    searchKeywords: z.array(z.string()).optional().default([])
  })
});

const updateProductSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(200).optional(),
    description: z.string().min(10).optional(),
    category: z.object({
      l1: z.string().min(1),
      l2: z.string().min(1),
      l3: z.string().optional()
    }).optional(),
    basePrice: z.number().min(0).optional(),
    currency: z.string().length(3).optional(),
    variants: z.array(variantSchema).optional(),
    status: z.enum(['draft', 'published', 'unpublished']).optional(),
    searchKeywords: z.array(z.string()).optional()
  }),
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid Product ID format')
  })
});

const productIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid Product ID format')
  })
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  productIdParamSchema
};
