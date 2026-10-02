const express = require('express');
const router = express.Router();
const reviewController = require('./review.controller');
const requireAuth = require('../../middleware/auth');
const requireRole = require('../../middleware/rbac');
const validate = require('../../middleware/validate');
const {
  createReviewSchema,
  updateReviewSchema,
  voteReviewSchema,
  sellerResponseSchema,
  listReviewsSchema
} = require('./review.validation');

/**
 * Review Routes (REV-FR-01 to 05, Phase 3.2)
 */

// Public: List reviews for a product (REV-FR-03)
router.get(
  '/',
  validate(listReviewsSchema),
  reviewController.list.bind(reviewController)
);

// Authenticated: Create a review (REV-FR-01, verified-purchase gated in service)
router.post(
  '/',
  requireAuth,
  validate(createReviewSchema),
  reviewController.create.bind(reviewController)
);

// Authenticated: Update own review
router.put(
  '/:id',
  requireAuth,
  validate(updateReviewSchema),
  reviewController.update.bind(reviewController)
);

// Authenticated: Delete own review
router.delete(
  '/:id',
  requireAuth,
  reviewController.remove.bind(reviewController)
);

// Authenticated: Vote helpful/unhelpful (REV-FR-04)
router.post(
  '/:id/vote',
  requireAuth,
  validate(voteReviewSchema),
  reviewController.vote.bind(reviewController)
);

// Seller: Respond to a review (REV-FR-05)
router.post(
  '/:id/response',
  requireAuth,
  requireRole('seller', 'admin'),
  validate(sellerResponseSchema),
  reviewController.sellerResponse.bind(reviewController)
);

module.exports = router;
