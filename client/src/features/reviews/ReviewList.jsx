import React, { useState } from 'react';
import {
  useGetProductReviewsQuery,
  useVoteReviewMutation,
} from '../../store/reviewApi';
import Rating from '../../components/ui/Rating';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { ThumbsUp, User } from 'lucide-react';

/**
 * ReviewList — Amazon-style customer reviews section (Section 5).
 * Left column: Histogram breakdown & review button
 * Right column: Review cards with verified purchase & helpful votes
 */
export default function ReviewList({ productId, currentUserId, onWriteReview, canReview }) {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('newest');

  const { data, isLoading } = useGetProductReviewsQuery(
    { productId, page, limit: 10, sort },
    { skip: !productId }
  );

  const [voteReview] = useVoteReviewMutation();

  const reviews = data?.data || [];
  const meta = data?.meta || {};
  const distribution = meta.ratingDistribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const pagination = meta.pagination || { totalItems: 0, page: 1, totalPages: 1 };
  const totalReviews = pagination.totalItems || reviews.length;

  const totalStars = Object.entries(distribution).reduce(
    (sum, [stars, count]) => sum + Number(stars) * count,
    0
  );
  const overallAvg = totalReviews > 0 ? (totalStars / totalReviews).toFixed(1) : '0.0';

  const handleVote = async (reviewId, vote) => {
    try {
      await voteReview({ id: reviewId, vote, productId }).unwrap();
    } catch (err) {
      // Handled silently
    }
  };

  const getPercentage = (count) => {
    if (!totalReviews || totalReviews === 0) return 0;
    return Math.round((count / totalReviews) * 100);
  };

  return (
    <div className="pt-8 border-t border-[#D5D9D9]">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Column: Rating Histogram (4 cols) */}
        <div className="md:col-span-4 lg:col-span-4 space-y-5">
          <div>
            <h2 className="text-[21px] font-semibold text-[#0F1111]">
              Customer Reviews
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <Rating value={Number(overallAvg)} size={18} />
              <span className="text-[16px] font-medium text-[#0F1111]">
                {overallAvg} out of 5
              </span>
            </div>
            <p className="text-[13px] text-[#565959] mt-0.5">
              {totalReviews.toLocaleString()} global ratings
            </p>
          </div>

          {/* Histogram Bars */}
          <div className="space-y-2 text-[13px]">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = distribution[stars] || 0;
              const pct = getPercentage(count);
              return (
                <div key={stars} className="flex items-center gap-2 group cursor-pointer">
                  <span className="w-12 text-[#007185] group-hover:text-[#C7511F] group-hover:underline">
                    {stars} star
                  </span>
                  <div className="flex-1 h-5 bg-[#F0F2F2] border border-[#D5D9D9] rounded-[2px] overflow-hidden">
                    <div
                      className="h-full bg-[#FFA41C] transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-9 text-right text-[#565959] text-[12px] group-hover:text-[#0F1111]">
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>

          {/* Review this product banner */}
          <div className="pt-4 border-t border-[#D5D9D9]">
            <h3 className="text-[16px] font-semibold text-[#0F1111] mb-1">
              Review this product
            </h3>
            <p className="text-[13px] text-[#565959] mb-3">
              Share your thoughts with other customers
            </p>
            {canReview ? (
              <Button variant="secondary" size="form" fullWidth onClick={onWriteReview}>
                Write a customer review
              </Button>
            ) : (
              <p className="text-[12px] text-[#565959] italic bg-[#F7FAFA] p-2.5 border border-[#D5D9D9] rounded-[3px]">
                Only verified purchasers can submit reviews for this product.
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Reviews List (8 cols) */}
        <div className="md:col-span-8 lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#D5D9D9]">
            <span className="text-[14px] font-semibold text-[#0F1111]">
              Top reviews from verified customers
            </span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="h-[30px] px-2 text-[12px] bg-[#F0F2F2] border border-[#D5D9D9] rounded-[3px] text-[#0F1111]"
            >
              <option value="newest">Newest first</option>
              <option value="highest">Highest rating</option>
              <option value="lowest">Lowest rating</option>
              <option value="helpful">Most helpful</option>
            </select>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 bg-[#F0F2F2] skeleton rounded-[3px]" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-[13px] text-[#565959] py-6">
              There are no reviews for this product yet. Be the first to write a review!
            </div>
          ) : (
            <div className="space-y-6 divide-y divide-[#D5D9D9]">
              {reviews.map((rev) => (
                <div key={rev._id || rev.id} className="pt-4 first:pt-0 space-y-1.5">
                  {/* User Profile */}
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#D5D9D9] flex items-center justify-center text-[#565959]">
                      <User size={16} strokeWidth={1.75} />
                    </div>
                    <span className="text-[13px] font-medium text-[#0F1111]">
                      {rev.userId?.name || rev.userName || (rev.customerEmail ? rev.customerEmail.split('@')[0] : 'ShopSphere Customer')}
                    </span>
                  </div>

                  {/* Rating + Title */}
                  <div className="flex items-center gap-2">
                    <Rating value={rev.rating} size={14} />
                    <span className="text-[13px] font-semibold text-[#0F1111]">
                      {rev.title || rev.headline || 'Verified Review'}
                    </span>
                  </div>

                  {/* Date & Verified Badge */}
                  <div className="text-[12px] text-[#565959] flex items-center gap-2">
                    <span>
                      Reviewed on {new Date(rev.createdAt || Date.now()).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                    <span className="text-[#C45500] font-semibold text-[11px]">
                      Verified Purchase
                    </span>
                  </div>

                  {/* Comment */}
                  <p className="text-[14px] text-[#0F1111] leading-relaxed pt-1">
                    {rev.body || rev.comment || rev.content}
                  </p>

                  {/* Helpful Button */}
                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleVote(rev._id || rev.id, 'helpful')}
                      className="inline-flex items-center gap-1.5 h-[28px] px-3 bg-white border border-[#D5D9D9] hover:bg-[#F7FAFA] rounded-[3px] text-[12px] text-[#0F1111] shadow-xs transition-colors"
                    >
                      <ThumbsUp size={13} strokeWidth={1.75} />
                      Helpful
                    </button>
                    {rev.helpfulCount > 0 && (
                      <span className="text-[12px] text-[#565959]">
                        {rev.helpfulCount} people found this helpful
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
