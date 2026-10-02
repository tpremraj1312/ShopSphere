import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toggleCompare, selectIsInCompare } from '../../store/compareSlice';
import Price from './Price';
import Rating from './Rating';
import Badge from './Badge';
import Button from './Button';

/**
 * ProductCard supporting rail, list, and grid variants.
 * Strictly adheres to Amazon layout & typography:
 * - Title: 13-14px, weight 400-500, line-clamp-2
 * - Price: Marketplace whole/fraction style
 * - No oversized pill buttons or rounded-2xl
 */
export default function ProductCard({
  product,
  variant = 'grid',
  onAddToCart,
  className = '',
}) {
  const dispatch = useDispatch();

  if (!product) return null;

  const {
    id,
    _id,
    name = product.title || product.name || 'Untitled Product',
    price = product.basePrice ?? product.price ?? product.variants?.[0]?.price ?? 0,
    listPrice = product.listPrice || (product.basePrice ? Number((product.basePrice * 1.25).toFixed(2)) : undefined),
    images = (product.variants?.[0]?.images?.length ? product.variants[0].images : (product.images || [])),
    rating = product.ratingAvg ?? product.averageRating ?? 0,
    reviewCount = product.ratingCount ?? product.reviewsCount ?? 0,
    stock = product.variants?.[0]?.stock ?? product.stock ?? product.quantity ?? 10,
    isDeal = product.isDeal || Boolean(product.basePrice && product.ratingAvg >= 4.5),
    isBestSeller = product.isBestSeller || Boolean(product.ratingCount >= 40),
  } = product;

  const productId = id || _id;
  const isInCompare = useSelector(selectIsInCompare(productId));
  const imageSrc = images[0]?.url || images[0] || product.image || '/placeholder-product.svg';

  const discountPercent =
    listPrice && listPrice > price
      ? Math.round(((listPrice - price) / listPrice) * 100)
      : null;


  /* ================= LIST VARIANT (Search Results, Section 5) ================= */
  if (variant === 'list') {
    return (
      <div
        className={`flex flex-col sm:flex-row gap-4 p-4 bg-white border border-[#D5D9D9] rounded-[4px] hover:border-[#A6A6A6] transition-colors ${className}`}
      >
        {/* Product Image */}
        <div className="w-full sm:w-[200px] h-[200px] shrink-0 bg-[#F0F2F2] flex items-center justify-center p-2 rounded-[2px] overflow-hidden">
          <Link to={`/products/${productId}`} className="w-full h-full flex items-center justify-center">
            <img
              src={imageSrc}
              alt={name}
              className="max-h-full max-w-full object-contain"
              loading="lazy"
            />
          </Link>
        </div>

        {/* Product Details */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            {isBestSeller && (
              <div className="mb-1">
                <Badge variant="bestSeller" size="sm">#1 Best Seller</Badge>
              </div>
            )}
            {isDeal && (
              <div className="mb-1">
                <Badge variant="deal" size="sm">Limited time deal</Badge>
              </div>
            )}

            {product.brand && (
              <div className="text-[12px] text-[#565959] mb-0.5">{product.brand}</div>
            )}

            <Link
              to={`/products/${productId}`}
              className="text-[15px] font-medium text-[#0F1111] hover:text-[#C7511F] line-clamp-2 leading-snug"
            >
              {name}
            </Link>

            {/* Rating */}
            <div className="mt-1.5 flex items-center gap-1.5 text-[12px]">
              <Rating value={rating} size={14} />
              {reviewCount > 0 && (
                <span className="text-[#007185] hover:text-[#C7511F] hover:underline">
                  {reviewCount.toLocaleString()}
                </span>
              )}
            </div>

            {/* Pricing */}
            <div className="mt-2 flex items-baseline gap-2">
              <Price amount={price} listPrice={listPrice} discountPercent={discountPercent} />
            </div>

            {/* Delivery / Stock */}
            <div className="mt-1 text-[12px]">
              {stock > 0 ? (
                <span className="text-[#007600] font-medium">In Stock</span>
              ) : (
                <span className="text-[#B12704] font-medium">Currently Unavailable</span>
              )}
              <span className="text-[#565959] ml-2">FREE Delivery available</span>
            </div>
          </div>

          {/* Action */}
          <div className="mt-3 flex items-center justify-between gap-3">
            <Button
              variant="primary"
              size="compact"
              onClick={(e) => {
                e.preventDefault();
                onAddToCart?.(product);
              }}
              disabled={stock <= 0}
            >
              Add to cart
            </Button>

            <label
              className="flex items-center gap-1.5 text-[12px] text-[#565959] hover:text-[#0F1111] cursor-pointer select-none"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="checkbox"
                checked={isInCompare}
                onChange={() => dispatch(toggleCompare(product))}
                className="h-3.5 w-3.5 text-[#007185] rounded border-[#888C8C] focus:ring-[#007185]"
              />
              <span>Compare</span>
            </label>
          </div>
        </div>
      </div>
    );
  }

  /* ================= RAIL VARIANT (Horizontal Slider, Section 4.3) ================= */
  if (variant === 'rail') {
    return (
      <div
        className={`w-[180px] shrink-0 flex flex-col p-2 bg-white rounded-[2px] transition-colors ${className}`}
      >
        <Link
          to={`/products/${productId}`}
          className="w-full h-[180px] bg-[#F0F2F2] flex items-center justify-center p-2 rounded-[2px] overflow-hidden"
        >
          <img
            src={imageSrc}
            alt={name}
            className="max-h-full max-w-full object-contain"
            loading="lazy"
          />
        </Link>

        <div className="mt-2 flex-1 flex flex-col justify-between">
          <div>
            <Link
              to={`/products/${productId}`}
              className="text-[13px] text-[#0F1111] hover:text-[#C7511F] line-clamp-2 leading-tight"
            >
              {name}
            </Link>

            <div className="mt-1 flex items-center gap-1 text-[12px]">
              <Rating value={rating} size={12} />
              {reviewCount > 0 && (
                <span className="text-[#007185] text-[11px]">({reviewCount})</span>
              )}
            </div>

            <div className="mt-1">
              <Price amount={price} size="sm" />
            </div>
          </div>

          <div className="mt-1 text-[11px] text-[#007600]">
            Get it by tomorrow
          </div>
        </div>
      </div>
    );
  }

  /* ================= GRID VARIANT (Default) ================= */
  return (
    <div
      className={`flex flex-col bg-white border border-[#D5D9D9] rounded-[4px] p-3 hover:border-[#A6A6A6] transition-colors ${className}`}
    >
      <Link
        to={`/products/${productId}`}
        className="w-full h-[200px] bg-[#F0F2F2] flex items-center justify-center p-2 rounded-[2px] overflow-hidden"
      >
        <img
          src={imageSrc}
          alt={name}
          className="max-h-full max-w-full object-contain"
          loading="lazy"
        />
      </Link>

      <div className="mt-2.5 flex-1 flex flex-col justify-between">
        <div>
          {isBestSeller && (
            <div className="mb-1">
              <Badge variant="bestSeller" size="sm">#1 Best Seller</Badge>
            </div>
          )}
          {isDeal && (
            <div className="mb-1">
              <Badge variant="deal" size="sm">Deal</Badge>
            </div>
          )}

          <Link
            to={`/products/${productId}`}
            className="text-[14px] text-[#0F1111] hover:text-[#C7511F] line-clamp-2 leading-tight"
          >
            {name}
          </Link>

          <div className="mt-1.5 flex items-center gap-1.5 text-[12px]">
            <Rating value={rating} size={13} />
            {reviewCount > 0 && (
              <span className="text-[#007185] hover:text-[#C7511F] hover:underline text-[12px]">
                {reviewCount}
              </span>
            )}
          </div>

          <div className="mt-2">
            <Price amount={price} listPrice={listPrice} discountPercent={discountPercent} />
          </div>

          <div className="mt-1 text-[12px]">
            {stock > 0 ? (
              <span className="text-[#007600]">In Stock</span>
            ) : (
              <span className="text-[#B12704]">Out of Stock</span>
            )}
          </div>
        </div>

        <div className="mt-3 space-y-2">
          <Button
            variant="primary"
            size="compact"
            fullWidth
            onClick={(e) => {
              e.preventDefault();
              onAddToCart?.(product);
            }}
            disabled={stock <= 0}
          >
            Add to cart
          </Button>

          <div className="flex items-center justify-center">
            <label
              className="flex items-center gap-1.5 text-[12px] text-[#565959] hover:text-[#0F1111] cursor-pointer select-none"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="checkbox"
                checked={isInCompare}
                onChange={() => dispatch(toggleCompare(product))}
                className="h-3.5 w-3.5 text-[#007185] rounded border-[#888C8C] focus:ring-[#007185]"
              />
              <span>Add to Compare</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
