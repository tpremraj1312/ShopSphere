import React, { useState, useMemo } from 'react';
import { useGetSellerProductsQuery } from '../../store/productsApi';
import Rating from '../../components/ui/Rating';
import Badge from '../../components/ui/Badge';
import {
  Star,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Search,
  Filter,
  Package,
  TrendingUp,
  BarChart3,
  AlertCircle,
} from 'lucide-react';

/**
 * SellerReviews — Reviews & feedback dashboard for seller.
 * Pulls from product data since reviews are tied to products.
 */
export default function SellerReviews() {
  const { data: productsData, isLoading } = useGetSellerProductsQuery();
  const [ratingFilter, setRatingFilter] = useState(0); // 0 = all
  const [searchQuery, setSearchQuery] = useState('');

  const products = productsData?.data || [];

  // Build review stats from products
  const reviewStats = useMemo(() => {
    let totalReviews = 0;
    let totalRating = 0;
    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const productReviews = [];

    for (const product of products) {
      const count = product.ratingCount || 0;
      const avg = product.ratingAvg || 0;
      totalReviews += count;
      totalRating += avg * count;

      // Estimate distribution from average
      if (count > 0) {
        const fiveStarPct = Math.max(0, avg - 3) / 2;
        ratingDistribution[5] += Math.round(count * fiveStarPct * 0.5);
        ratingDistribution[4] += Math.round(count * fiveStarPct * 0.3);
        ratingDistribution[3] += Math.round(count * (1 - fiveStarPct) * 0.4);
        ratingDistribution[2] += Math.round(count * (1 - fiveStarPct) * 0.3);
        ratingDistribution[1] += Math.round(count * (1 - fiveStarPct) * 0.2);
      }

      productReviews.push({
        id: product._id,
        title: product.title,
        image: product.variants?.[0]?.images?.[0] || product.images?.[0] || '',
        ratingAvg: avg,
        ratingCount: count,
        category: product.category,
      });
    }

    const overallAvg = totalReviews > 0 ? totalRating / totalReviews : 0;

    return {
      totalReviews,
      overallAvg,
      ratingDistribution,
      productReviews: productReviews.sort((a, b) => b.ratingCount - a.ratingCount),
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = reviewStats.productReviews;

    if (ratingFilter > 0) {
      result = result.filter((p) => Math.round(p.ratingAvg) === ratingFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => p.title.toLowerCase().includes(q));
    }

    return result;
  }, [reviewStats.productReviews, ratingFilter, searchQuery]);

  const maxDistribution = Math.max(...Object.values(reviewStats.ratingDistribution), 1);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-[24px] sm:text-[28px] leading-8 font-normal text-[#0F1111]">
          Reviews & Feedback
        </h1>
        <p className="text-[13px] text-[#565959] mt-1">
          Monitor customer reviews and your store's overall rating.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Overall Rating */}
        <div className="bg-white border border-[#D5D9D9] rounded-[8px] p-5 text-center">
          <div className="text-[36px] font-bold text-[#0F1111]">
            {reviewStats.overallAvg.toFixed(1)}
          </div>
          <div className="flex justify-center mt-1">
            <Rating value={reviewStats.overallAvg} size="md" />
          </div>
          <div className="text-[13px] text-[#565959] mt-2">
            {reviewStats.totalReviews.toLocaleString('en-IN')} total reviews
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="bg-white border border-[#D5D9D9] rounded-[8px] p-4 sm:col-span-2">
          <h3 className="text-[14px] font-bold text-[#0F1111] mb-3">Rating Distribution</h3>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = reviewStats.ratingDistribution[star];
              const pct = maxDistribution > 0 ? (count / maxDistribution) * 100 : 0;
              return (
                <button
                  key={star}
                  onClick={() => setRatingFilter(ratingFilter === star ? 0 : star)}
                  className={`flex items-center gap-2 w-full text-left rounded-[3px] px-1 py-0.5 transition-colors ${
                    ratingFilter === star ? 'bg-[#FFF8E1]' : 'hover:bg-[#F7FAFA]'
                  }`}
                >
                  <span className="text-[12px] text-[#007185] font-medium w-10">{star} star</span>
                  <div className="flex-1 h-[14px] bg-[#F0F2F2] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#FFA41C] rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-[#565959] w-8 text-right">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#565959]" />
          <input
            type="text"
            placeholder="Search products by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-[34px] pl-9 pr-3 text-[13px] bg-white border border-[#888C8C] rounded-[3px] focus:outline-none focus:border-[#E77600]"
          />
        </div>
        {ratingFilter > 0 && (
          <button
            onClick={() => setRatingFilter(0)}
            className="text-[12px] text-[#007185] hover:underline"
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Product Reviews Table */}
      <div className="bg-white border border-[#D5D9D9] rounded-[8px] overflow-hidden">
        <div className="px-4 py-2.5 border-b border-[#D5D9D9] bg-[#F7F8F8] text-[13px] text-[#565959]">
          {isLoading ? 'Loading…' : `${filteredProducts.length} products`}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-[#F0F2F2] border-b border-[#D5D9D9]">
              <tr>
                <th className="px-4 py-2.5 font-bold text-[#0F1111]">Product</th>
                <th className="px-4 py-2.5 font-bold text-[#0F1111]">Rating</th>
                <th className="px-4 py-2.5 font-bold text-[#0F1111] hidden sm:table-cell">Reviews</th>
                <th className="px-4 py-2.5 font-bold text-[#0F1111] hidden md:table-cell">Category</th>
                <th className="px-4 py-2.5 font-bold text-[#0F1111]">Sentiment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E7E7]">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-4 py-3">
                      <div className="h-10 skeleton rounded" />
                    </td>
                  </tr>
                ))
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-14 text-center">
                    <Star size={36} strokeWidth={1.25} className="mx-auto text-[#8D9096]" />
                    <p className="mt-3 text-[16px] font-bold text-[#0F1111]">No reviews yet</p>
                    <p className="mt-1 text-[13px] text-[#565959]">
                      Customer reviews will appear here once they start rating your products.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const sentiment = product.ratingAvg >= 4 ? 'positive' : product.ratingAvg >= 3 ? 'mixed' : 'negative';
                  return (
                    <tr key={product.id} className="hover:bg-[#F7FAFA] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {product.image ? (
                            <img src={product.image} alt="" className="w-10 h-10 object-contain border border-[#D5D9D9] rounded p-0.5 shrink-0" />
                          ) : (
                            <div className="w-10 h-10 bg-[#F0F2F2] border border-[#D5D9D9] rounded flex items-center justify-center shrink-0">
                              <Package size={16} className="text-[#8D9096]" />
                            </div>
                          )}
                          <span className="text-[#0F1111] line-clamp-1 max-w-[200px]">{product.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Rating value={product.ratingAvg} size="sm" />
                          <span className="text-[12px] text-[#565959]">{product.ratingAvg.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#565959] hidden sm:table-cell">
                        {product.ratingCount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-[#565959] hidden md:table-cell text-[12px]">
                        {product.category?.l1} &gt; {product.category?.l2}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={sentiment === 'positive' ? 'inStock' : sentiment === 'mixed' ? 'neutral' : 'outOfStock'}
                          size="sm"
                        >
                          {sentiment === 'positive' && '👍 Positive'}
                          {sentiment === 'mixed' && '😐 Mixed'}
                          {sentiment === 'negative' && '👎 Needs work'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
