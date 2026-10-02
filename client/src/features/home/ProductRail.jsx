import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductCard from '../../components/ui/ProductCard';
import { ProductCardSkeleton } from '../../components/ui/Skeleton';

/**
 * ProductRail adhering to Section 4.3:
 * - White surface, padding 16px, 18px title + optional link
 * - Horizontally scrollable rail
 * - Large white arrow buttons (~80px tall) appearing on hover
 * - 6 visible cards on desktop, rail variant cards
 */
export default function ProductRail({
  title,
  subtitle,
  linkText = 'See all deals',
  linkTo = '/products',
  products = [],
  isLoading = false,
  onAddToCart,
}) {
  const scrollRef = useRef(null);
  const [showArrows, setShowArrows] = useState(false);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -650 : 650;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!isLoading && products.length === 0) {
    return null;
  }

  return (
    <div
      className="bg-white border border-[#D5D9D9] rounded-[2px] p-4 relative group"
      onMouseEnter={() => setShowArrows(true)}
      onMouseLeave={() => setShowArrows(false)}
    >
      {/* Header */}
      <div className="flex items-baseline justify-between mb-3">
        <div className="flex items-baseline gap-3">
          <h2 className="text-[18px] font-semibold text-[#0F1111]">
            {title}
          </h2>
          {subtitle && (
            <span className="text-[13px] text-[#565959]">{subtitle}</span>
          )}
        </div>
        {linkTo && (
          <Link
            to={linkTo}
            className="text-[13px] text-[#007185] hover:text-[#C7511F] hover:underline font-medium"
          >
            {linkText}
          </Link>
        )}
      </div>

      {/* Rail Container */}
      <div className="relative">
        {/* Left Arrow Button */}
        <button
          type="button"
          onClick={() => scroll('left')}
          aria-label="Scroll left"
          className={`absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-20 bg-white/95 hover:bg-white border border-[#D5D9D9] shadow-sm rounded-r-[3px] flex items-center justify-center text-[#0F1111] transition-opacity duration-150 focus:outline-none focus:ring-2 focus:ring-[#007185] ${
            showArrows ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <ChevronLeft size={24} strokeWidth={2} />
        </button>

        {/* Scrollable Products List */}
        <div
          ref={scrollRef}
          className="flex items-stretch gap-3 overflow-x-auto no-scrollbar scroll-smooth py-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-[180px] shrink-0 p-2">
                <ProductCardSkeleton />
              </div>
            ))
          ) : (
            products.map((product) => (
              <ProductCard
                key={product.id || product._id}
                product={product}
                variant="rail"
                onAddToCart={onAddToCart}
              />
            ))
          )}
        </div>

        {/* Right Arrow Button */}
        <button
          type="button"
          onClick={() => scroll('right')}
          aria-label="Scroll right"
          className={`absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-20 bg-white/95 hover:bg-white border border-[#D5D9D9] shadow-sm rounded-l-[3px] flex items-center justify-center text-[#0F1111] transition-opacity duration-150 focus:outline-none focus:ring-2 focus:ring-[#007185] ${
            showArrows ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <ChevronRight size={24} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
