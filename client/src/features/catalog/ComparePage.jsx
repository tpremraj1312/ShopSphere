import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectCompareItems,
  removeFromCompare,
  clearCompare,
} from '../../store/compareSlice';
import { useAddToCartMutation } from '../../store/cartApi';
import { useCompareWithAiMutation } from '../../store/productsApi';
import Price from '../../components/ui/Price';
import Rating from '../../components/ui/Rating';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Toast from '../../components/ui/Toast';
import AiCompareChat from './AiCompareChat';
import {
  Sparkles,
  Trash2,
  Plus,
  X,
  Check,
  Minus,
  Layers,
  ArrowRight,
  ShoppingCart,
  Zap,
  HelpCircle,
  CheckCircle,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';

export default function ComparePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const items = useSelector(selectCompareItems);

  const [highlightDifferences, setHighlightDifferences] = useState(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const [addToCart, { isLoading: isAddingToCart }] = useAddToCartMutation();
  const [compareWithAi, { isLoading: isAiAnalyzing }] = useCompareWithAiMutation();

  // Trigger initial AI comparison analysis when 2 or more products are present
  useEffect(() => {
    if (items.length >= 2) {
      compareWithAi({
        productIds: items.map((p) => p._id || p.id),
        products: items,
      })
        .unwrap()
        .then((res) => {
          setAiAnalysis(res?.data || res);
        })
        .catch((err) => {
          console.warn('AI analysis load notice:', err);
        });
    } else {
      setAiAnalysis(null);
    }
  }, [items.length]);

  // Aggregate all unique specification keys across all compared products
  const allSpecKeys = useMemo(() => {
    const keysSet = new Set();
    items.forEach((item) => {
      const specs = item.specs instanceof Map ? Object.fromEntries(item.specs) : item.specs;
      if (specs && typeof specs === 'object') {
        Object.keys(specs).forEach((k) => keysSet.add(k));
      }
    });
    return Array.from(keysSet);
  }, [items]);

  const handleAddToCart = async (product) => {
    const productId = product._id || product.id;
    try {
      await addToCart({ productId, quantity: 1 }).unwrap();
      setToastMessage(`Added "${product.title || product.name}" to cart`);
      setTimeout(() => setToastMessage(''), 3000);
    } catch (err) {
      setToastMessage(err?.data?.message || 'Failed to add item to cart');
      setTimeout(() => setToastMessage(''), 3000);
    }
  };

  const handleBuyNow = (product) => {
    const productId = product._id || product.id;
    navigate(`/checkout?buyNow=true&productId=${productId}&quantity=1`);
  };

  // Helper to check if values differ across items for a spec row
  const hasDiffInRow = (getter) => {
    if (items.length <= 1) return false;
    const firstVal = getter(items[0]);
    return items.some((item) => getter(item) !== firstVal);
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto my-14 px-4 text-center">
        <div className="bg-white border border-[#D5D9D9] rounded-[4px] p-10 sm:p-14 shadow-sm space-y-5">
          <div className="w-20 h-20 bg-[#F0F2F2] rounded-full flex items-center justify-center mx-auto text-[#565959]">
            <Layers size={40} />
          </div>
          <div>
            <h1 className="text-[24px] sm:text-[28px] font-bold text-[#0F1111]">
              Your comparison cart is empty
            </h1>
            <p className="text-[14px] text-[#565959] mt-2 max-w-md mx-auto">
              Add up to 4 items from product pages or search results using the <strong>Compare</strong> option to evaluate specifications, pricing, and buying recommendations side-by-side.
            </p>
          </div>
          <div className="pt-2">
            <Link to="/products">
              <Button variant="primary" className="!px-7 !py-2.5 text-[14px] font-medium">
                Browse Products to Compare
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50">
          <Toast message={toastMessage} onClose={() => setToastMessage('')} />
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D5D9D9]">
        <div>
          <nav className="text-[12px] text-[#565959] mb-1 flex items-center gap-1.5">
            <Link to="/" className="hover:text-[#007185] hover:underline">Home</Link>
            <span>/</span>
            <Link to="/products" className="hover:text-[#007185] hover:underline">Products</Link>
            <span>/</span>
            <span className="text-[#0F1111] font-medium">Product Comparison</span>
          </nav>
          <h1 className="text-[24px] sm:text-[28px] font-normal text-[#0F1111] flex items-center gap-2">
            <span>Product Comparison</span>
            <span className="text-[14px] bg-[#EAEDED] text-[#565959] px-2 py-0.5 rounded font-medium">
              {items.length} of 4 items
            </span>
          </h1>
        </div>

        {/* Header Action controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Buying Advisor button */}
          <button
            type="button"
            onClick={() => setIsAiChatOpen(true)}
            className="flex items-center gap-2 bg-[#232F3E] text-white hover:bg-[#37475A] px-3.5 py-2 rounded-[4px] text-[13px] font-medium shadow-sm transition-colors border border-[#131A22]"
          >
            <span>Buying Advisor</span>
          </button>

          {/* Highlight differences toggle */}
          <button
            type="button"
            onClick={() => setHighlightDifferences(!highlightDifferences)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-[4px] text-[13px] border transition-colors ${
              highlightDifferences
                ? 'bg-[#FFF8E7] border-[#FFA41C] text-[#B12704] font-medium'
                : 'bg-white border-[#D5D9D9] text-[#0F1111] hover:bg-[#F7FAFA]'
            }`}
          >
            <SlidersHorizontal size={14} />
            <span>{highlightDifferences ? 'Differences Highlighted' : 'Highlight Differences'}</span>
          </button>

          {/* Clear all */}
          <button
            type="button"
            onClick={() => dispatch(clearCompare())}
            className="flex items-center gap-1.5 px-3 py-2 text-[13px] text-[#565959] hover:text-[#C40000] transition-colors"
          >
            <Trash2 size={15} />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      {/* Buying Guide & Recommendation Banner */}
      {items.length >= 2 && (
        <div className="bg-white border border-[#D5D9D9] rounded-[4px] p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded bg-[#232F3E] text-[#FFD814] flex items-center justify-center shrink-0 mt-0.5">
                <span className="font-bold text-[14px]">VS</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-[15px] font-bold text-[#0F1111]">
                    Specification &amp; Value Analysis
                  </h2>
                  <span className="text-[11px] bg-[#F0F2F2] text-[#565959] font-medium px-2 py-0.5 rounded border border-[#D5D9D9]">
                    Comparative Overview
                  </span>
                </div>
                <p className="text-[13px] text-[#333333] leading-relaxed max-w-4xl">
                  {isAiAnalyzing ? (
                    <span className="text-[#565959] italic flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#007185] animate-ping" />
                      Synthesizing comparative specs and customer satisfaction data...
                    </span>
                  ) : aiAnalysis?.verdict || aiAnalysis?.recommendation ? (
                    aiAnalysis.verdict || aiAnalysis.recommendation
                  ) : (
                    'Evaluating specifications to determine the best match for your needs.'
                  )}
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="compact"
              onClick={() => setIsAiChatOpen(true)}
              className="shrink-0 flex items-center gap-1.5 !px-3.5 text-[13px] border-[#D5D9D9] hover:bg-[#F7FAFA] whitespace-nowrap text-[#0F1111]"
            >
              <span>Open Advisor</span>
              <ArrowRight size={14} />
            </Button>
          </div>
        </div>
      )}

      {/* Comparison Table Container */}
      <div className="bg-white border border-[#D5D9D9] rounded-[4px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[13px]">
            {/* Header: Products Cards Row */}
            <thead>
              <tr className="border-b-2 border-[#D5D9D9] divide-x divide-[#E7E7E7] bg-[#FAFAFA]">
                <th className="p-4 w-44 sm:w-56 min-w-[170px] align-top bg-[#F7F7F7]">
                  <div className="space-y-2">
                    <p className="text-[14px] font-bold text-[#0F1111]">Compared Products</p>
                    <p className="text-[12px] text-[#565959]">
                      Side-by-side feature comparison
                    </p>
                    {items.length < 4 && (
                      <Link
                        to="/products"
                        className="inline-flex items-center gap-1 text-[12px] text-[#007185] hover:text-[#C7511F] hover:underline pt-2 font-medium"
                      >
                        <Plus size={14} />
                        <span>Add more items</span>
                      </Link>
                    )}
                  </div>
                </th>

                {items.map((product) => {
                  const id = product._id || product.id;
                  const title = product.title || product.name || 'Untitled';
                  const price = product.basePrice ?? product.price ?? product.variants?.[0]?.price ?? 0;
                  const listPrice = product.listPrice;
                  const rating = product.ratingAvg ?? product.averageRating ?? 0;
                  const reviewCount = product.ratingCount ?? product.reviewsCount ?? 0;
                  const stock = product.variants?.[0]?.stock ?? product.stock ?? 10;
                  const image =
                    product.variants?.[0]?.images?.[0]?.url ||
                    product.variants?.[0]?.images?.[0] ||
                    product.images?.[0]?.url ||
                    product.images?.[0] ||
                    product.image ||
                    '/placeholder-product.svg';

                  return (
                    <th
                      key={id}
                      className="p-4 w-64 min-w-[240px] max-w-[280px] align-top font-normal bg-white relative group"
                    >
                      <button
                        type="button"
                        onClick={() => dispatch(removeFromCompare(id))}
                        className="absolute top-2 right-2 text-[#565959] hover:text-[#C40000] p-1 rounded hover:bg-[#F0F2F2] transition-colors"
                        title="Remove from comparison"
                      >
                        <X size={16} />
                      </button>

                      {/* Product image */}
                      <div className="w-full h-44 bg-[#F0F2F2] rounded-[4px] p-2 flex items-center justify-center mb-3 overflow-hidden">
                        <Link to={`/products/${id}`} className="w-full h-full flex items-center justify-center">
                          <img
                            src={image}
                            alt={title}
                            className="max-h-full max-w-full object-contain hover:scale-105 transition-transform"
                          />
                        </Link>
                      </div>

                      {/* Product title */}
                      <Link
                        to={`/products/${id}`}
                        className="font-medium text-[#0F1111] hover:text-[#007185] hover:underline text-[14px] line-clamp-2 leading-snug mb-2 block"
                      >
                        {title}
                      </Link>

                      {/* Rating */}
                      <div className="flex items-center gap-1.5 text-[12px] mb-2">
                        <Rating value={rating} size={14} />
                        <span className="text-[#007185] font-medium">({reviewCount})</span>
                      </div>

                      {/* Price */}
                      <div className="mb-3">
                        <Price amount={price} listPrice={listPrice} size="md" />
                      </div>

                      {/* Stock */}
                      <div className="mb-3 text-[12px]">
                        {stock > 0 ? (
                          <span className="text-[#007600] font-medium">In Stock</span>
                        ) : (
                          <span className="text-[#B12704] font-medium">Out of Stock</span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="space-y-2">
                        <Button
                          variant="primary"
                          size="compact"
                          fullWidth
                          onClick={() => handleAddToCart(product)}
                          disabled={stock <= 0}
                          className="flex items-center justify-center gap-1.5 text-[13px]"
                        >
                          <ShoppingCart size={14} />
                          <span>Add to Cart</span>
                        </Button>

                        <Button
                          variant="secondary"
                          size="compact"
                          fullWidth
                          onClick={() => handleBuyNow(product)}
                          disabled={stock <= 0}
                          className="flex items-center justify-center gap-1.5 text-[13px]"
                        >
                          <Zap size={14} />
                          <span>Buy Now</span>
                        </Button>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-[#E7E7E7]">
              {/* SECTION: HIGHLIGHTS & POSITIONING */}
              <tr className="bg-[#F0F2F2]">
                <td
                  colSpan={items.length + 1}
                  className="px-4 py-2 text-[12px] font-bold text-[#0F1111] uppercase tracking-wider"
                >
                  Model Positioning &amp; Key Highlights
                </td>
              </tr>

              <tr className="divide-x divide-[#E7E7E7]">
                <td className="p-4 font-bold text-[#0F1111] bg-[#FAFAFA]">
                  Positioning &amp; Assessment
                </td>

                {items.map((p) => {
                  const id = p._id || p.id;
                  const itemAnalysis = aiAnalysis?.prosCons?.find(
                    (pc) => pc.id === id || pc.title === (p.title || p.name)
                  );
                  return (
                    <td key={id} className="p-4 align-top">
                      {itemAnalysis?.badge && (
                        <div className="mb-2">
                          <span className="inline-block bg-[#007600]/10 border border-[#007600]/25 text-[#007600] px-2.5 py-1 rounded text-[12px] font-bold">
                            {itemAnalysis.badge}
                          </span>
                        </div>
                      )}

                      {itemAnalysis?.pros && itemAnalysis.pros.length > 0 && (
                        <div className="space-y-1 mb-2">
                          <p className="text-[11px] font-bold text-[#007600] uppercase tracking-wide">
                            Key Strengths:
                          </p>
                          {itemAnalysis.pros.map((pro, pIdx) => (
                            <div key={pIdx} className="flex items-start gap-1.5 text-[12px] text-[#007600]">
                              <Check size={13} className="shrink-0 mt-0.5" />
                              <span>{pro}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {itemAnalysis?.cons && itemAnalysis.cons.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[11px] font-bold text-[#888C8C] uppercase tracking-wide">
                            Considerations:
                          </p>
                          {itemAnalysis.cons.map((con, cIdx) => (
                            <div key={cIdx} className="flex items-start gap-1.5 text-[12px] text-[#565959]">
                              <Minus size={13} className="shrink-0 mt-0.5" />
                              <span>{con}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* SECTION: PRICING & VALUE */}
              <tr className="bg-[#F0F2F2]">
                <td
                  colSpan={items.length + 1}
                  className="px-4 py-2 text-[12px] font-bold text-[#0F1111] uppercase tracking-wider"
                >
                  Pricing &amp; Value
                </td>
              </tr>

              {/* Price Row */}
              <tr
                className={`divide-x divide-[#E7E7E7] ${
                  highlightDifferences && hasDiffInRow((p) => p.basePrice ?? p.price ?? 0)
                    ? 'bg-[#FFF8E7]'
                    : ''
                }`}
              >
                <td className="p-4 font-bold text-[#0F1111] bg-[#FAFAFA]">
                  Effective Price
                </td>
                {items.map((p) => {
                  const price = p.basePrice ?? p.price ?? 0;
                  return (
                    <td key={p._id || p.id} className="p-4">
                      <span className="text-[15px] font-bold text-[#B12704]">
                        ₹{Number(price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                  );
                })}
              </tr>

              {/* Discount Row */}
              <tr
                className={`divide-x divide-[#E7E7E7] ${
                  highlightDifferences &&
                  hasDiffInRow((p) => {
                    const price = p.basePrice ?? p.price ?? 0;
                    return p.listPrice && p.listPrice > price
                      ? Math.round(((p.listPrice - price) / p.listPrice) * 100)
                      : 0;
                  })
                    ? 'bg-[#FFF8E7]'
                    : ''
                }`}
              >
                <td className="p-4 font-bold text-[#0F1111] bg-[#FAFAFA]">
                  Discount &amp; Savings
                </td>
                {items.map((p) => {
                  const price = p.basePrice ?? p.price ?? 0;
                  const discount =
                    p.listPrice && p.listPrice > price
                      ? Math.round(((p.listPrice - price) / p.listPrice) * 100)
                      : null;
                  return (
                    <td key={p._id || p.id} className="p-4">
                      {discount ? (
                        <span className="text-[#007600] font-bold">
                          {discount}% off (MRP ₹{p.listPrice.toLocaleString('en-IN')})
                        </span>
                      ) : (
                        <span className="text-[#565959]">Standard Price</span>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* SECTION: GENERAL SPECS */}
              <tr className="bg-[#F0F2F2]">
                <td
                  colSpan={items.length + 1}
                  className="px-4 py-2 text-[12px] font-bold text-[#0F1111] uppercase tracking-wider"
                >
                  Overview &amp; Brand Details
                </td>
              </tr>

              {/* Brand Row */}
              <tr
                className={`divide-x divide-[#E7E7E7] ${
                  highlightDifferences && hasDiffInRow((p) => p.brand || '—') ? 'bg-[#FFF8E7]' : ''
                }`}
              >
                <td className="p-4 font-bold text-[#0F1111] bg-[#FAFAFA]">
                  Brand
                </td>
                {items.map((p) => (
                  <td key={p._id || p.id} className="p-4 text-[#0F1111]">
                    {p.brand || '—'}
                  </td>
                ))}
              </tr>

              {/* Category Row */}
              <tr
                className={`divide-x divide-[#E7E7E7] ${
                  highlightDifferences &&
                  hasDiffInRow((p) => p.category?.name || p.categoryL1 || '—')
                    ? 'bg-[#FFF8E7]'
                    : ''
                }`}
              >
                <td className="p-4 font-bold text-[#0F1111] bg-[#FAFAFA]">
                  Category
                </td>
                {items.map((p) => (
                  <td key={p._id || p.id} className="p-4 text-[#0F1111]">
                    {p.category?.name || p.categoryL1 || 'General'}
                  </td>
                ))}
              </tr>

              {/* Customer Rating Row */}
              <tr
                className={`divide-x divide-[#E7E7E7] ${
                  highlightDifferences &&
                  hasDiffInRow((p) => (p.ratingAvg ?? p.averageRating ?? 0).toFixed(1))
                    ? 'bg-[#FFF8E7]'
                    : ''
                }`}
              >
                <td className="p-4 font-bold text-[#0F1111] bg-[#FAFAFA]">
                  Customer Rating
                </td>
                {items.map((p) => {
                  const rating = p.ratingAvg ?? p.averageRating ?? 0;
                  const count = p.ratingCount ?? p.reviewsCount ?? 0;
                  return (
                    <td key={p._id || p.id} className="p-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[#0F1111]">{rating.toFixed(1)}</span>
                        <Rating value={rating} size={13} />
                        <span className="text-[#565959] text-[12px]">({count})</span>
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* SECTION: DETAILED SPECIFICATIONS (DYNAMIC) */}
              {allSpecKeys.length > 0 && (
                <>
                  <tr className="bg-[#F0F2F2]">
                    <td
                      colSpan={items.length + 1}
                      className="px-4 py-2 text-[12px] font-bold text-[#0F1111] uppercase tracking-wider"
                    >
                      Technical Specifications
                    </td>
                  </tr>

                  {allSpecKeys.map((specKey) => {
                    const getSpecVal = (p) => {
                      const specs = p.specs instanceof Map ? Object.fromEntries(p.specs) : p.specs;
                      return specs?.[specKey] || '—';
                    };
                    const isDiff = highlightDifferences && hasDiffInRow(getSpecVal);

                    return (
                      <tr
                        key={specKey}
                        className={`divide-x divide-[#E7E7E7] ${isDiff ? 'bg-[#FFF8E7]' : ''}`}
                      >
                        <td className="p-4 font-medium text-[#0F1111] bg-[#FAFAFA] capitalize">
                          {specKey.replace(/([A-Z])/g, ' $1').trim()}
                        </td>
                        {items.map((p) => (
                          <td key={p._id || p.id} className="p-4 text-[#333333]">
                            {getSpecVal(p)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-out AI Consultation Chat Panel */}
      <AiCompareChat
        products={items}
        isOpen={isAiChatOpen}
        onClose={() => setIsAiChatOpen(false)}
        initialAnalysis={aiAnalysis}
      />
    </div>
  );
}
