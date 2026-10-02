const mongoose = require('mongoose');
const Review = require('./review.model');
const Order = require('../orders/order.model');
const Product = require('../products/product.model');

class ReviewService {
  /**
   * Create a new review (REV-FR-01, Step 3.2.2)
   * Server-side gate: customer must have a 'delivered' subOrder containing the product.
   */
  async createReview(customerId, reviewData) {
    const { productId, orderId, rating, title, body, photos } = reviewData;

    const pId = new mongoose.Types.ObjectId(productId);
    const oId = new mongoose.Types.ObjectId(orderId);
    const cId = new mongoose.Types.ObjectId(customerId.toString());

    // 1. Verify the product exists
    const product = await Product.findById(pId).lean();
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      error.code = 'PRODUCT_NOT_FOUND';
      throw error;
    }

    // 2. Verified-purchase gate: check the customer has a delivered subOrder with this product
    const order = await Order.findOne({
      _id: oId,
      customerId: cId
    }).lean();

    if (!order) {
      const error = new Error('Order not found or does not belong to you');
      error.statusCode = 403;
      error.code = 'ORDER_NOT_FOUND';
      throw error;
    }

    const deliveredSubWithProduct = (order.subOrders || []).some(sub =>
      sub.status === 'delivered' &&
      (sub.items || []).some(item => item.productId?.toString() === pId.toString())
    );

    if (!deliveredSubWithProduct) {
      const error = new Error('You can only review products from orders that have been delivered');
      error.statusCode = 403;
      error.code = 'NOT_DELIVERED';
      throw error;
    }

    // 3. Check for duplicate review (compound unique index will also catch, but friendly error)
    const existing = await Review.findOne({ productId: pId, customerId: cId, orderId: oId });
    if (existing) {
      const error = new Error('You have already reviewed this product for this order');
      error.statusCode = 409;
      error.code = 'DUPLICATE_REVIEW';
      throw error;
    }

    // 4. Create the review
    const review = await Review.create({
      productId: pId,
      customerId: cId,
      orderId: oId,
      rating,
      title: title || '',
      body,
      photos: photos || [],
      isVerifiedPurchase: true
    });

    // 5. Trigger rating recomputation (inline for now; BullMQ job in Step 3.2.3)
    await this._recomputeProductRating(pId);

    return review;
  }

  /**
   * Update own review (REV-FR-01)
   */
  async updateReview(customerId, reviewId, updateData) {
    const review = await Review.findOne({
      _id: reviewId,
      customerId: new mongoose.Types.ObjectId(customerId.toString())
    });

    if (!review) {
      const error = new Error('Review not found or you do not have permission to edit it');
      error.statusCode = 404;
      error.code = 'REVIEW_NOT_FOUND';
      throw error;
    }

    if (updateData.rating !== undefined) review.rating = updateData.rating;
    if (updateData.title !== undefined) review.title = updateData.title;
    if (updateData.body !== undefined) review.body = updateData.body;
    if (updateData.photos !== undefined) review.photos = updateData.photos;

    await review.save();

    // Recompute rating if score changed
    if (updateData.rating !== undefined) {
      await this._recomputeProductRating(review.productId);
    }

    return review;
  }

  /**
   * Delete own review (REV-FR-01)
   */
  async deleteReview(customerId, reviewId) {
    const review = await Review.findOneAndDelete({
      _id: reviewId,
      customerId: new mongoose.Types.ObjectId(customerId.toString())
    });

    if (!review) {
      const error = new Error('Review not found or you do not have permission to delete it');
      error.statusCode = 404;
      error.code = 'REVIEW_NOT_FOUND';
      throw error;
    }

    // Recompute rating after deletion
    await this._recomputeProductRating(review.productId);

    return { deleted: true, reviewId: review._id };
  }

  /**
   * List reviews for a product (REV-FR-03, Step 3.2.3)
   */
  async listReviews(productId, options = {}) {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.max(1, Math.min(50, Number(options.limit) || 10));
    const sort = options.sort || 'newest';

    const filter = {
      productId: new mongoose.Types.ObjectId(productId),
      status: 'active'
    };

    const sortMap = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      highest: { rating: -1, createdAt: -1 },
      lowest: { rating: 1, createdAt: -1 },
      helpful: { helpfulVotes: -1, createdAt: -1 }
    };

    const totalCount = await Review.countDocuments(filter);
    const reviews = await Review.find(filter)
      .sort(sortMap[sort] || sortMap.newest)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('customerId', 'email')
      .lean();

    // Compute rating distribution
    const ratingDistribution = await Review.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const bucket of ratingDistribution) {
      distribution[bucket._id] = bucket.count;
    }

    return {
      reviews: reviews.map(r => ({
        ...r,
        // Remove voter details from public listing (privacy)
        voters: undefined,
        customerEmail: r.customerId?.email || 'Anonymous',
        customerId: r.customerId?._id || r.customerId
      })),
      ratingDistribution: distribution,
      pagination: {
        totalItems: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit) || 1
      }
    };
  }

  /**
   * Vote on a review as helpful or unhelpful (REV-FR-04, Step 3.2.5)
   */
  async voteReview(userId, reviewId, vote) {
    const review = await Review.findById(reviewId);

    if (!review) {
      const error = new Error('Review not found');
      error.statusCode = 404;
      error.code = 'REVIEW_NOT_FOUND';
      throw error;
    }

    // Prevent reviewing own review
    if (review.customerId.toString() === userId.toString()) {
      const error = new Error('You cannot vote on your own review');
      error.statusCode = 400;
      error.code = 'SELF_VOTE';
      throw error;
    }

    const uId = new mongoose.Types.ObjectId(userId.toString());
    const existingVoteIdx = review.voters.findIndex(
      v => v.userId.toString() === uId.toString()
    );

    if (existingVoteIdx >= 0) {
      const existingVote = review.voters[existingVoteIdx].vote;

      if (existingVote === vote) {
        // Undo the vote
        review.voters.splice(existingVoteIdx, 1);
        if (vote === 'helpful') review.helpfulVotes = Math.max(0, review.helpfulVotes - 1);
        else review.unhelpfulVotes = Math.max(0, review.unhelpfulVotes - 1);
      } else {
        // Switch the vote
        review.voters[existingVoteIdx].vote = vote;
        if (vote === 'helpful') {
          review.helpfulVotes++;
          review.unhelpfulVotes = Math.max(0, review.unhelpfulVotes - 1);
        } else {
          review.unhelpfulVotes++;
          review.helpfulVotes = Math.max(0, review.helpfulVotes - 1);
        }
      }
    } else {
      // New vote
      review.voters.push({ userId: uId, vote });
      if (vote === 'helpful') review.helpfulVotes++;
      else review.unhelpfulVotes++;
    }

    await review.save();

    return {
      reviewId: review._id,
      helpfulVotes: review.helpfulVotes,
      unhelpfulVotes: review.unhelpfulVotes
    };
  }

  /**
   * Seller responds to a review (REV-FR-05, Step 3.2.5)
   * Must be the seller who owns the product being reviewed.
   */
  async addSellerResponse(sellerId, reviewId, responseBody) {
    const review = await Review.findById(reviewId);

    if (!review) {
      const error = new Error('Review not found');
      error.statusCode = 404;
      error.code = 'REVIEW_NOT_FOUND';
      throw error;
    }

    // Verify the seller owns the product
    const product = await Product.findOne({
      _id: review.productId,
      sellerId: new mongoose.Types.ObjectId(sellerId.toString())
    }).lean();

    if (!product) {
      const error = new Error('You can only respond to reviews on your own products');
      error.statusCode = 403;
      error.code = 'NOT_PRODUCT_OWNER';
      throw error;
    }

    review.sellerResponse = {
      body: responseBody,
      respondedAt: new Date()
    };

    await review.save();

    return review;
  }

  /**
   * Recompute product ratingAvg and ratingCount (REV-FR-03, Step 3.2.3)
   * Called as a background-style recomputation on review create/edit/delete.
   * In a production system this would be a BullMQ job (NFR-SCALE-02).
   */
  async _recomputeProductRating(productId) {
    const stats = await Review.aggregate([
      {
        $match: {
          productId: new mongoose.Types.ObjectId(productId.toString()),
          status: 'active'
        }
      },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 }
        }
      }
    ]);

    const avg = stats.length > 0 ? Number(stats[0].avgRating.toFixed(2)) : 0;
    const count = stats.length > 0 ? stats[0].count : 0;

    await Product.findByIdAndUpdate(productId, {
      ratingAvg: avg,
      ratingCount: count
    });

    return { ratingAvg: avg, ratingCount: count };
  }
}

module.exports = new ReviewService();
