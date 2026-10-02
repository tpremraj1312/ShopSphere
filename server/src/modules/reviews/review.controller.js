const reviewService = require('./review.service');
const { sendSuccess } = require('../../shared/response');

class ReviewController {
  /**
   * POST /api/v1/reviews
   * Create a review (REV-FR-01, Step 3.2.2) — verified-purchase gate in service layer
   */
  async create(req, res, next) {
    try {
      const review = await reviewService.createReview(req.user._id, req.body);
      return sendSuccess(res, review, null, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/reviews/:id
   * Update own review
   */
  async update(req, res, next) {
    try {
      const review = await reviewService.updateReview(req.user._id, req.params.id, req.body);
      return sendSuccess(res, review);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/reviews/:id
   * Delete own review
   */
  async remove(req, res, next) {
    try {
      const result = await reviewService.deleteReview(req.user._id, req.params.id);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/reviews?productId=...&page=...&sort=...
   * List reviews for a product (public)
   */
  async list(req, res, next) {
    try {
      const result = await reviewService.listReviews(req.query.productId, req.query);
      return sendSuccess(res, result.reviews, {
        ratingDistribution: result.ratingDistribution,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/reviews/:id/vote
   * Helpful/Unhelpful voting (REV-FR-04, Step 3.2.5)
   */
  async vote(req, res, next) {
    try {
      const result = await reviewService.voteReview(req.user._id, req.params.id, req.body.vote);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/reviews/:id/response
   * Seller responds to a review (REV-FR-05, Step 3.2.5)
   */
  async sellerResponse(req, res, next) {
    try {
      const review = await reviewService.addSellerResponse(req.user._id, req.params.id, req.body.body);
      return sendSuccess(res, review);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReviewController();
