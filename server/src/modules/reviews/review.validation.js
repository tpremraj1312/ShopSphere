const { z } = require('zod');

/**
 * Validation schemas for Reviews & Ratings (REV-FR-01 to 05, Phase 3.2)
 */

// POST /api/v1/reviews — Create a review (REV-FR-01)
const createReviewSchema = z.object({
  body: z.object({
    productId: z.string().min(1, 'Product ID is required'),
    orderId: z.string().min(1, 'Order ID is required'),
    rating: z.number().int().min(1, 'Rating must be between 1 and 5').max(5, 'Rating must be between 1 and 5'),
    title: z.string().max(200).optional().default(''),
    body: z.string().min(1, 'Review body is required').max(5000, 'Review body must be at most 5000 characters'),
    photos: z.array(z.string().url()).max(5, 'Maximum 5 photos allowed').optional().default([])
  })
});

// PUT /api/v1/reviews/:id — Update own review
const updateReviewSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Review ID is required')
  }),
  body: z.object({
    rating: z.number().int().min(1).max(5).optional(),
    title: z.string().max(200).optional(),
    body: z.string().min(1).max(5000).optional(),
    photos: z.array(z.string().url()).max(5).optional()
  })
});

// POST /api/v1/reviews/:id/vote — Helpful/Unhelpful voting (REV-FR-04)
const voteReviewSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Review ID is required')
  }),
  body: z.object({
    vote: z.enum(['helpful', 'unhelpful'], { errorMap: () => ({ message: 'Vote must be "helpful" or "unhelpful"' }) })
  })
});

// POST /api/v1/reviews/:id/response — Seller response (REV-FR-05)
const sellerResponseSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Review ID is required')
  }),
  body: z.object({
    body: z.string().min(1, 'Response body is required').max(2000, 'Response must be at most 2000 characters')
  })
});

// GET /api/v1/reviews?productId=...&page=...&sort=...
const listReviewsSchema = z.object({
  query: z.object({
    productId: z.string().min(1, 'Product ID is required'),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    sort: z.enum(['newest', 'oldest', 'highest', 'lowest', 'helpful']).optional()
  })
});

module.exports = {
  createReviewSchema,
  updateReviewSchema,
  voteReviewSchema,
  sellerResponseSchema,
  listReviewsSchema
};
