import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toggleCompare, selectIsInCompare, selectCompareCount } from '../../store/compareSlice';
import ShareModal from '../../components/ShareModal';
import { useGetProductByIdQuery } from '../../store/productsApi';
import { useAddToCartMutation } from '../../store/cartApi';
import { useGetMyOrdersQuery, useCreateCheckoutOrderMutation } from '../../store/orderApi';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import Price from '../../components/ui/Price';
import Rating from '../../components/ui/Rating';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Toast from '../../components/ui/Toast';
import ReviewList from '../reviews/ReviewList';
import ReviewForm from '../reviews/ReviewForm';
import AlsoBoughtRail from './AlsoBoughtRail';
import { MapPin, ShieldCheck, Truck, RotateCcw, Award, Package, ChevronDown, ChevronUp, Layers, Share2, Check } from 'lucide-react';

/**
 * Collapsible description section for "About this item"
 */
function DescriptionSection({ description }) {
  const [expanded, setExpanded] = useState(false);
  
  // Parse description into structured sections
  const sections = useMemo(() => {
    if (!description) return [];
    const lines = description.split('\n').filter((l) => l.trim());
    const result = [];
    let currentSection = { title: '', bullets: [] };

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('###')) {
        if (currentSection.title || currentSection.bullets.length > 0) {
          result.push(currentSection);
        }
        currentSection = { title: trimmed.replace(/^#+\s*/, ''), bullets: [] };
      } else if (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('•')) {
        currentSection.bullets.push(trimmed.replace(/^[-*•]\s*/, ''));
      } else if (trimmed) {
        currentSection.bullets.push(trimmed);
      }
    }
    if (currentSection.title || currentSection.bullets.length > 0) {
      result.push(currentSection);
    }
    return result;
  }, [description]);

  const visibleSections = expanded ? sections : sections.slice(0, 2);

  return (
    <div>
      {visibleSections.map((sec, idx) => (
        <div key={idx} className={idx > 0 ? 'mt-4' : ''}>
          {sec.title && (
            <h3 className="text-[14px] font-bold text-[#0F1111] mb-1.5">
              {sec.title}
            </h3>
          )}
          <ul className="list-disc pl-5 space-y-1.5 text-[13px] text-[#0F1111] leading-relaxed">
            {sec.bullets.map((bullet, bIdx) => {
              // Render bold markdown **text** within bullets
              const parts = bullet.split(/(\*\*[^*]+\*\*)/g);
              return (
                <li key={bIdx}>
                  {parts.map((part, pIdx) =>
                    part.startsWith('**') && part.endsWith('**') ? (
                      <strong key={pIdx}>{part.slice(2, -2)}</strong>
                    ) : (
                      <span key={pIdx}>{part}</span>
                    )
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      {sections.length > 2 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 flex items-center gap-1 text-[13px] text-[#007185] hover:text-[#C7511F] hover:underline transition-colors"
        >
          {expanded ? 'Show less' : 'Show more'}
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      )}
    </div>
  );
}

/**
 * Product specifications table
 */
function SpecsTable({ specs, brand, category }) {
  // Combine specs from product.specs Map + fallback data
  const specEntries = useMemo(() => {
    const entries = [];
    if (brand) entries.push(['Brand', brand]);
    if (category?.l1) entries.push(['Department', category.l1]);
    if (category?.l2) entries.push(['Category', category.l2]);
    if (category?.l3) entries.push(['Sub-Category', category.l3]);

    // specs can be a Map or plain object
    if (specs) {
      const specObj = specs instanceof Map ? Object.fromEntries(specs) : specs;
      for (const [key, value] of Object.entries(specObj)) {
        if (key !== 'Brand' && key !== 'Category' && value) {
          entries.push([key, value]);
        }
      }
    }
    return entries;
  }, [specs, brand, category]);

  if (specEntries.length === 0) return null;

  return (
    <div>
      <h2 className="text-[18px] font-semibold text-[#0F1111] mb-3">
        Product Information
      </h2>
      <div className="border border-[#D5D9D9] rounded-[4px] overflow-hidden">
        <table className="w-full text-[13px]">
          <tbody>
            {specEntries.map(([key, value], idx) => (
              <tr
                key={key}
                className={idx % 2 === 0 ? 'bg-[#F7FAFA]' : 'bg-white'}
              >
                <td className="px-4 py-2.5 text-[#565959] font-medium w-[40%] border-r border-[#D5D9D9] align-top">
                  {key}
                </td>
                <td className="px-4 py-2.5 text-[#0F1111]">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const isInCompare = useSelector(selectIsInCompare(id));
  const compareCount = useSelector(selectCompareCount);

  const [isShareOpen, setIsShareOpen] = useState(false);
  const { data, isLoading, error } = useGetProductByIdQuery(id);
  const { data: ordersData } = useGetMyOrdersQuery(undefined, { skip: !isAuthenticated });
  const [addToCart, { isLoading: isAdding }] = useAddToCartMutation();
  const [createCheckoutOrder, { isLoading: isBuyingNow }] = useCreateCheckoutOrderMutation();

  const product = data?.data;

  // Gate for verified review
  const myOrders = ordersData?.data?.orders || [];
  const deliveredOrder = myOrders.find((order) =>
    order.subOrders?.some((sub) =>
      sub.status === 'delivered' &&
      sub.items?.some((item) => {
        const itemProdId = item.productId?._id || item.productId;
        return itemProdId?.toString() === product?._id?.toString();
      })
    )
  );

  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [toastMessage, setToastMessage] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const currentVariant = product?.variants?.[selectedVariantIndex];
  const allImages = useMemo(() => {
    const list = [];
    if (currentVariant?.images?.length) {
      list.push(...currentVariant.images);
    }
    if (product?.images?.length) {
      product.images.forEach((img) => {
        if (!list.includes(img)) list.push(img);
      });
    }
    product?.variants?.forEach((v) => {
      (v.images || []).forEach((img) => {
        if (!list.includes(img)) list.push(img);
      });
    });
    if (product?.image && !list.includes(product.image)) {
      list.push(product.image);
    }
    return list.length ? list : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80'];
  }, [currentVariant, product]);

  const displayImage =
    selectedImage ||
    allImages[0] ||
    product?.image ||
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80';

  useEffect(() => {
    if (currentVariant?.images?.length) {
      setSelectedImage(currentVariant.images[0]);
    }
  }, [selectedVariantIndex, currentVariant]);

  // Scroll to top when product changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  // Update recently viewed in localStorage
  useEffect(() => {
    if (product?._id || product?.id) {
      try {
        const prodId = product._id || product.id;
        const stored = localStorage.getItem('shopsphere_recently_viewed');
        const list = stored ? JSON.parse(stored) : [];
        const filtered = list.filter((i) => i !== prodId);
        filtered.unshift(prodId);
        localStorage.setItem('shopsphere_recently_viewed', JSON.stringify(filtered.slice(0, 15)));
      } catch (e) {
        // ignore
      }
    }
  }, [product]);

  const price = currentVariant?.price ?? product?.basePrice ?? 0;
  const listPrice = currentVariant?.listPrice || (price > 0 ? Number((price * 1.25).toFixed(2)) : undefined);
  const stock = currentVariant?.stock ?? 15;
  const discountPercent = listPrice ? Math.round(((listPrice - price) / listPrice) * 100) : null;

  // Dynamic delivery date
  const deliveryDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + (price > 35 ? 1 : 3));
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  }, [price]);

  const handleAddToCart = async (redirectCheckout = false) => {
    try {
      await addToCart({
        productId: product._id,
        sku: currentVariant?.sku || 'DEFAULT',
        qty: Number(quantity),
      }).unwrap();

      if (redirectCheckout) {
        navigate('/checkout');
      } else {
        setToastMessage(`Added ${quantity} of "${product.title || product.name}" to cart.`);
      }
    } catch (err) {
      const errorMsg = err?.data?.error?.message || err?.message || 'Failed to add item to cart. Please try again.';
      setToastMessage(errorMsg);
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }
    try {
      const res = await createCheckoutOrder({
        items: [{
          productId: product._id,
          sku: currentVariant?.sku || 'DEFAULT',
          qty: Number(quantity),
        }],
        paymentMethod: 'razorpay',
      }).unwrap();

      const order = res?.data?.order || res?.data;
      const orderId = order?._id || order?.id;
      if (orderId) {
        navigate(`/checkout/payment/${orderId}`);
      } else {
        navigate('/orders');
      }
    } catch (err) {
      const errorMsg = err?.data?.error?.message || err?.data?.message || err?.message || 'Failed to process Buy Now. Please try again.';
      setToastMessage(errorMsg);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-[1500px] mx-auto px-4 py-8 bg-white min-h-[600px]">
        <div className="h-4 w-48 bg-[#F0F2F2] mb-6 rounded skeleton" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-3">
            <div className="h-[460px] bg-[#F0F2F2] rounded skeleton" />
            <div className="flex gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-12 h-12 bg-[#F0F2F2] rounded skeleton" />
              ))}
            </div>
          </div>
          <div className="lg:col-span-4 space-y-4">
            <div className="h-5 bg-[#F0F2F2] rounded w-1/4 skeleton" />
            <div className="h-8 bg-[#F0F2F2] rounded w-3/4 skeleton" />
            <div className="h-5 bg-[#F0F2F2] rounded w-1/3 skeleton" />
            <div className="h-1 bg-[#D5D9D9] rounded w-full" />
            <div className="h-10 bg-[#F0F2F2] rounded w-1/2 skeleton" />
            <div className="h-1 bg-[#D5D9D9] rounded w-full" />
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-4 bg-[#F0F2F2] rounded skeleton" style={{ width: `${70 + i * 5}%` }} />
              ))}
            </div>
          </div>
          <div className="lg:col-span-3 h-[380px] bg-[#F0F2F2] rounded skeleton" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="bg-white p-8 rounded-[4px] border border-[#D5D9D9]">
          <h2 className="text-[20px] font-semibold text-[#0F1111] mb-2">Product Not Found</h2>
          <p className="text-[13px] text-[#565959] mb-6">
            The requested product could not be found or is temporarily unavailable.
          </p>
          <Link to="/products">
            <Button variant="primary">Return to search results</Button>
          </Link>
        </div>
      </div>
    );
  }

  const categoryName = product.category?.l1 || 'Products';
  const categoryL2 = product.category?.l2;
  const sellerName = product.sellerId?.businessName || product.sellerId?.email || 'ShopSphere Direct';

  return (
    <div className="bg-white min-h-screen border-b border-[#D5D9D9] pb-16">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 py-4">
        {/* Breadcrumbs */}
        <div className="mb-4">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: categoryName, href: `/products?categoryL1=${encodeURIComponent(categoryName)}` },
              ...(categoryL2
                ? [{ label: categoryL2, href: `/products?categoryL1=${encodeURIComponent(categoryName)}&categoryL2=${encodeURIComponent(categoryL2)}` }]
                : []),
              { label: product.title || product.name },
            ]}
          />
        </div>

        {/* 3-Column Layout: Gallery (40%) | Details (35%) | Buy Box (25%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* ================= COLUMN 1: Image Gallery (5 cols ~ 40%) ================= */}
          <div className="lg:col-span-5 lg:sticky lg:top-20">
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              {/* Thumbnails */}
              {allImages.length > 1 && (
                <div className="flex sm:flex-col gap-2 overflow-x-auto sm:overflow-y-auto max-h-[460px] no-scrollbar shrink-0">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onMouseEnter={() => setSelectedImage(img)}
                      onClick={() => setSelectedImage(img)}
                      className={`w-[52px] h-[52px] rounded-[3px] border overflow-hidden p-0.5 bg-[#F7FAFA] flex items-center justify-center transition-all duration-150 ${
                        displayImage === img
                          ? 'border-[#E77600] ring-2 ring-[#E77600]/30 shadow-sm'
                          : 'border-[#D5D9D9] hover:border-[#0F1111]'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`View ${idx + 1}`}
                        className="max-h-full max-w-full object-contain"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Main Image Frame with hover magnify */}
              <div className="flex-1 h-[340px] sm:h-[460px] bg-[#F7FAFA] border border-[#D5D9D9] rounded-[4px] flex items-center justify-center p-6 relative group overflow-hidden cursor-crosshair">
                <img
                  src={displayImage}
                  alt={product.title || product.name}
                  className="max-h-full max-w-full object-contain transition-transform duration-300 ease-out group-hover:scale-125"
                />
                <div className="absolute bottom-3 right-3 bg-white/80 backdrop-blur-sm text-[11px] text-[#565959] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  Roll over to zoom
                </div>
              </div>
            </div>
          </div>

          {/* ================= COLUMN 2: Product Details (4 cols ~ 35%) ================= */}
          <div className="lg:col-span-4 space-y-3">
            {/* Brand link */}
            <Link
              to={`/products?brand=${encodeURIComponent(product.brand || sellerName)}`}
              className="text-[13px] text-[#007185] hover:text-[#C7511F] hover:underline transition-colors inline-block"
            >
              Visit the {product.brand || sellerName} Store
            </Link>

            {/* Title & Share */}
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-[22px] sm:text-[24px] font-normal text-[#0F1111] leading-snug flex-1">
                {product.title || product.name}
              </h1>
              <button
                type="button"
                onClick={() => setIsShareOpen(true)}
                className="flex items-center gap-1.5 text-[12px] text-[#007185] hover:text-[#C7511F] px-2.5 py-1.5 rounded hover:bg-[#F0F2F2] border border-[#D5D9D9] shrink-0 transition-colors shadow-2xs"
                title="Share product with short link"
              >
                <Share2 size={14} />
                <span className="font-medium">Share</span>
              </button>
            </div>

            {/* Rating row */}
            <div className="flex items-center gap-2 text-[13px] flex-wrap">
              <Rating value={product.ratingAvg || product.averageRating || 4.2} size={15} />
              <a
                href="#reviews"
                className="text-[#007185] hover:text-[#C7511F] hover:underline transition-colors"
              >
                {(product.ratingCount || product.reviewsCount || 128).toLocaleString()} ratings
              </a>
              <span className="text-[#D5D9D9]">|</span>
              <a
                href="#reviews"
                className="text-[#007185] hover:text-[#C7511F] hover:underline transition-colors"
              >
                Search in reviews
              </a>
            </div>

            {/* Best Seller / Purchase count badge */}
            <div className="flex items-center gap-2 pb-3 border-b border-[#D5D9D9]">
              {(product.ratingCount || 0) > 50 && (
                <span className="inline-flex items-center gap-1 bg-[#F0F2F2] border border-[#D5D9D9] text-[12px] text-[#0F1111] px-2 py-0.5 rounded-[3px]">
                  <Award size={13} className="text-[#E77600]" />
                  Popular Choice
                </span>
              )}
              <span className="text-[12px] text-[#565959]">
                {((product.ratingCount || 128) * 3 + 500).toLocaleString()}+ bought in past month
              </span>
            </div>

            {/* Price Section */}
            <div className="pt-1 pb-3 border-b border-[#D5D9D9] space-y-1">
              {discountPercent && discountPercent > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="deal" size="sm">Limited time deal</Badge>
                  <span className="text-[18px] font-light text-[#CC0C39]">
                    -{discountPercent}%
                  </span>
                </div>
              )}
              <div className="flex items-baseline gap-2">
                <Price amount={price} size="lg" />
              </div>
              {listPrice && (
                <div className="text-[12px] text-[#565959]">
                  Typical price:{' '}
                  <span className="line-through">₹{Number(listPrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}
              {price > 35 && (
                <div className="text-[12px] text-[#007600] font-medium">
                  FREE Returns
                </div>
              )}
            </div>

            {/* Variant Selectors */}
            {product.variants?.length > 1 && (
              <div className="py-2 space-y-2 border-b border-[#D5D9D9]">
                <div className="text-[13px] text-[#565959]">
                  Configuration:{' '}
                  <strong className="text-[#0F1111]">
                    {currentVariant?.name || currentVariant?.sku || `Option ${selectedVariantIndex + 1}`}
                  </strong>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v, idx) => {
                    const vAttrs = v.attributes instanceof Map
                      ? Object.fromEntries(v.attributes)
                      : (v.attributes || {});
                    const label = vAttrs.Edition || vAttrs.Color || v.name || v.sku || `Variant ${idx + 1}`;
                    return (
                      <button
                        key={v.sku || idx}
                        type="button"
                        onClick={() => setSelectedVariantIndex(idx)}
                        className={`px-3 py-2 text-[12px] rounded-[4px] border transition-all duration-150 ${
                          selectedVariantIndex === idx
                            ? 'border-[#E77600] bg-[#FFF8F2] font-semibold text-[#0F1111] ring-1 ring-[#E77600] shadow-sm'
                            : 'border-[#D5D9D9] hover:border-[#0F1111] bg-white text-[#0F1111]'
                        }`}
                      >
                        <div className="font-medium">{label}</div>
                        <div className="text-[11px] text-[#565959] mt-0.5">
                          ${(v.price ?? price).toFixed(2)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* About This Item */}
            <div className="pt-3">
              <h2 className="text-[14px] font-bold text-[#0F1111] mb-2">
                About this item
              </h2>
              <DescriptionSection description={product.description} />
              {!product.description && (
                <ul className="list-disc pl-5 space-y-1.5 text-[13px] text-[#0F1111] leading-relaxed">
                  <li>High quality engineering designed for reliability and extended everyday use.</li>
                  <li>Precision crafted with durable materials to ensure maximum satisfaction.</li>
                  <li>Compatible with standard accessories across the ShopSphere ecosystem.</li>
                </ul>
              )}
            </div>
          </div>

          {/* ================= COLUMN 3: Sticky Buy Box (3 cols ~ 25%) ================= */}
          <div className="lg:col-span-3">
            <div className="border border-[#D5D9D9] rounded-[8px] p-4 bg-white space-y-3 sticky top-20 shadow-sm">
              {/* Price */}
              <div>
                <Price amount={price} size="lg" />
                {price > 35 && (
                  <div className="text-[12px] text-[#007600] mt-0.5">
                    & FREE Returns
                  </div>
                )}
              </div>

              {/* Delivery Estimation */}
              <div className="text-[13px] text-[#0F1111] leading-snug space-y-1.5">
                <div className="flex items-start gap-2">
                  <Truck size={16} className="text-[#0F1111] shrink-0 mt-0.5" strokeWidth={1.75} />
                  <div>
                    <span className="text-[#007600] font-semibold">FREE delivery </span>
                    <strong className="font-semibold">{deliveryDate}</strong>
                    {price > 35 && (
                      <span className="text-[#565959]"> on orders over $35</span>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Package size={16} className="text-[#0F1111] shrink-0 mt-0.5" strokeWidth={1.75} />
                  <span>
                    Or fastest delivery{' '}
                    <strong>
                      {new Date(Date.now() + 86400000).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[12px] text-[#007185]">
                <MapPin size={14} strokeWidth={1.75} />
                <span>Deliver to {user?.name || 'Customer'} – Select location</span>
              </div>

              {/* Stock Status */}
              <div className="text-[18px] font-medium pt-1">
                {stock > 20 ? (
                  <span className="text-[#007600]">In Stock</span>
                ) : stock > 0 ? (
                  <span className="text-[#B12704]">Only {stock} left in stock – order soon.</span>
                ) : (
                  <span className="text-[#B12704]">Currently Unavailable</span>
                )}
              </div>

              {/* Quantity Selector */}
              {stock > 0 && (
                <div className="flex items-center gap-2">
                  <label htmlFor="qty-select" className="text-[13px] text-[#565959]">
                    Quantity:
                  </label>
                  <select
                    id="qty-select"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="h-[30px] px-2 text-[13px] bg-[#F0F2F2] border border-[#D5D9D9] rounded-[7px] text-[#0F1111] cursor-pointer focus:border-[#E77600] focus:ring-1 focus:ring-[#E77600] transition-colors"
                  >
                    {Array.from({ length: Math.min(stock, 10) }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Buttons: Add to Cart + Buy Now */}
              <div className="space-y-2 pt-1">
                <Button
                  variant="primary"
                  size="form"
                  fullWidth
                  disabled={stock <= 0 || isAdding}
                  onClick={() => handleAddToCart(false)}
                >
                  Add to Cart
                </Button>

                <Button
                  variant="buy"
                  size="form"
                  fullWidth
                  disabled={stock <= 0 || isAdding || isBuyingNow}
                  onClick={handleBuyNow}
                >
                  {isBuyingNow ? 'Processing...' : 'Buy Now'}
                </Button>

                {/* Compare Action */}
                <div className="pt-2">
                  <Button
                    type="button"
                    variant={isInCompare ? "secondary" : "outline"}
                    size="form"
                    fullWidth
                    onClick={() => dispatch(toggleCompare(product))}
                    className={`flex items-center justify-center gap-2 text-[13px] border transition-all ${
                      isInCompare
                        ? 'border-[#FFA41C] bg-[#FFF8E7] text-[#B12704] font-medium'
                        : 'border-[#D5D9D9] hover:border-[#007185] text-[#0F1111]'
                    }`}
                  >
                    <Layers size={15} />
                    <span>{isInCompare ? `✓ In Compare List (${compareCount}/4)` : 'Compare with similar items'}</span>
                  </Button>
                  {isInCompare && (
                    <Link
                      to="/compare"
                      className="block text-center text-[12px] text-[#007185] hover:text-[#C7511F] hover:underline mt-1.5 font-medium"
                    >
                      View side-by-side comparison →
                    </Link>
                  )}
                </div>
              </div>

              {/* Ships from / Sold by / Returns */}
              <div className="pt-2 border-t border-[#D5D9D9] text-[12px] text-[#565959] space-y-1.5">
                <div className="flex justify-between">
                  <span>Ships from</span>
                  <span className="text-[#0F1111]">ShopSphere Logistics</span>
                </div>
                <div className="flex justify-between">
                  <span>Sold by</span>
                  <span className="text-[#007185] hover:underline cursor-pointer">{sellerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Returns</span>
                  <span className="text-[#007185] hover:underline cursor-pointer">
                    <RotateCcw size={11} className="inline mr-1" />
                    30-day refund/replacement
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Payment</span>
                  <span className="text-[#007185] hover:underline cursor-pointer">Secure transaction</span>
                </div>
              </div>

              {/* Secure transaction badge */}
              <div className="flex items-center gap-2 pt-2 border-t border-[#D5D9D9] text-[12px] text-[#565959]">
                <ShieldCheck size={16} strokeWidth={1.75} className="text-[#007600]" />
                <span>Secure transaction · Your data is safe</span>
              </div>

              {/* Gift option */}
              <div className="flex items-center gap-2 text-[12px] text-[#0F1111]">
                <input type="checkbox" className="accent-[#007185]" id="gift-option" />
                <label htmlFor="gift-option" className="cursor-pointer">Add a gift receipt for easy returns</label>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Product Information / Specifications Table ─── */}
        <div className="mt-12 pt-8 border-t border-[#D5D9D9]">
          <SpecsTable
            specs={product.specs}
            brand={product.brand}
            category={product.category}
          />
        </div>

        {/* Recommendations: Customers Also Bought & Related Products Rail */}
        <AlsoBoughtRail
          productId={product._id || product.id}
          categoryL1={product.category?.l1}
          categoryL2={product.category?.l2}
          brand={product.brand}
        />

        {/* Customer Reviews Section */}
        <div id="reviews" className="mt-12 pt-8 border-t border-[#D5D9D9]">
          {showReviewForm && (
            <div className="mb-8 p-5 bg-[#F7FAFA] border border-[#D5D9D9] rounded-[4px]">
              <ReviewForm
                productId={product._id || product.id}
                onSuccess={() => setShowReviewForm(false)}
                onCancel={() => setShowReviewForm(false)}
              />
            </div>
          )}

          <ReviewList
            productId={product._id || product.id}
            currentUserId={user?.id || user?._id}
            canReview={Boolean(deliveredOrder)}
            onWriteReview={() => setShowReviewForm(true)}
          />
        </div>
      </div>

      {toastMessage && (
        <Toast
          message={toastMessage}
          type="success"
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        product={product}
      />
    </div>
  );
}
