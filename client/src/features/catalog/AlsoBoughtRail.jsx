import React from 'react';
import { Link } from 'react-router-dom';
import { useGetAlsoBoughtQuery, useGetProductsQuery } from '../../store/productsApi';
import Price from '../../components/ui/Price';
import Rating from '../../components/ui/Rating';
import Badge from '../../components/ui/Badge';

/**
 * AlsoBoughtRail — Professional dual-rail recommendations:
 * 1. "Customers who viewed this item also viewed" (Smart co-purchase + affinity)
 * 2. "Related products in this category" (Category peer recommendations)
 */
export default function AlsoBoughtRail({ productId, categoryL1, categoryL2, brand }) {
  // 1. Co-purchase / Viewed items
  const { data: alsoBoughtData, isLoading: alsoBoughtLoading } = useGetAlsoBoughtQuery(
    { id: productId, limit: 6 },
    { skip: !productId }
  );

  // 2. Category peers
  const { data: categoryData, isLoading: categoryLoading } = useGetProductsQuery(
    {
      categoryL1,
      ...(categoryL2 && { categoryL2 }),
      limit: 7,
    },
    { skip: !categoryL1 }
  );

  const alsoBought = (alsoBoughtData?.data || []).filter(
    (item) => (item._id || item.id) !== productId
  );

  const categoryPeers = (categoryData?.data || [])
    .filter((item) => (item._id || item.id) !== productId)
    .slice(0, 6);

  const renderProductCard = (item) => {
    const mainImage =
      item.variants?.[0]?.images?.[0] ||
      item.images?.[0] ||
      item.image ||
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80';
    const price = item.variants?.[0]?.price ?? item.basePrice ?? 0;
    const rating = item.ratingAvg || item.averageRating || 4.2;
    const count = item.ratingCount || item.reviewsCount || 48;
    const isPrimeEligible = price > 35;

    return (
      <Link
        key={item._id || item.id}
        to={`/products/${item._id || item.id}`}
        className="group bg-white border border-[#D5D9D9] hover:border-[#A6A6A6] rounded-[4px] p-3 flex flex-col justify-between transition-all hover:shadow-md"
      >
        <div>
          <div className="aspect-square bg-[#F7FAFA] rounded-[3px] overflow-hidden mb-2.5 flex items-center justify-center p-2 relative">
            <img
              src={mainImage}
              alt={item.title || item.name}
              className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-200"
              loading="lazy"
            />
            {item.brand && (
              <span className="absolute top-1 left-1 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-white/90 rounded text-[#565959] shadow-xs">
                {item.brand}
              </span>
            )}
          </div>

          <h3 className="text-[13px] text-[#0F1111] group-hover:text-[#C7511F] line-clamp-2 leading-snug font-medium mb-1">
            {item.title || item.name}
          </h3>

          <div className="flex items-center gap-1.5 mb-1">
            <Rating value={rating} size={12} />
            <span className="text-[11px] text-[#007185]">({count})</span>
          </div>

          {isPrimeEligible && (
            <div className="text-[11px] text-[#007185] font-semibold flex items-center gap-1 mb-1">
              <span className="text-[#007185] font-bold">prime</span>
              <span className="text-[#565959] font-normal text-[10px]">FREE One-Day</span>
            </div>
          )}
        </div>

        <div className="mt-2 pt-2 border-t border-[#F0F2F2] flex items-baseline justify-between">
          <Price amount={price} size="sm" />
          <span className="text-[11px] text-[#007600] font-medium">In Stock</span>
        </div>
      </Link>
    );
  };

  return (
    <div className="mt-12 space-y-10">
      {/* ─── Rail 1: Also Bought / Also Viewed ─── */}
      {alsoBought.length > 0 && (
        <div className="pt-8 border-t border-[#D5D9D9]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[18px] font-bold text-[#0F1111] leading-tight">
                Customers who viewed this item also viewed
              </h2>
              <p className="text-[12px] text-[#565959] mt-0.5">
                Recommended based on shopping activity & similar preferences
              </p>
            </div>
            <span className="text-[12px] text-[#565959] hidden sm:inline">
              Page 1 of 1
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {alsoBought.map(renderProductCard)}
          </div>
        </div>
      )}

      {/* ─── Rail 2: Related Products in Same Category ─── */}
      {categoryPeers.length > 0 && (
        <div className="pt-8 border-t border-[#D5D9D9]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[18px] font-bold text-[#0F1111] leading-tight">
                Related products in {categoryL2 || categoryL1 || 'this department'}
              </h2>
              <p className="text-[12px] text-[#565959] mt-0.5">
                Explore more top-rated choices from {brand || categoryL1}
              </p>
            </div>
            {categoryL1 && (
              <Link
                to={`/products?categoryL1=${encodeURIComponent(categoryL1)}${categoryL2 ? `&categoryL2=${encodeURIComponent(categoryL2)}` : ''}`}
                className="text-[13px] text-[#007185] hover:text-[#C7511F] hover:underline transition-colors font-medium whitespace-nowrap"
              >
                See more
              </Link>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {categoryPeers.map(renderProductCard)}
          </div>
        </div>
      )}
    </div>
  );
}
