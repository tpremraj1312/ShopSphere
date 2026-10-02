import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  useGetCartQuery,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useClearCartMutation,
} from '../../store/cartApi';
import Price from '../../components/ui/Price';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { CheckCircle2, ShieldCheck } from 'lucide-react';

export default function CartPage() {
  const { data, isLoading } = useGetCartQuery();
  const [updateCartItem, { isLoading: isUpdating }] = useUpdateCartItemMutation();
  const [removeCartItem, { isLoading: isRemoving }] = useRemoveCartItemMutation();
  const [clearCart, { isLoading: isClearing }] = useClearCartMutation();

  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');

  const navigate = useNavigate();
  const cart = data?.data;
  const items = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const totalItemCount = items.reduce((acc, item) => acc + (item.qty || 1), 0);

  const freeShippingThreshold = 35;
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (couponCode.trim().toUpperCase() === 'SAVE10') {
      const discount = Number((subtotal * 0.1).toFixed(2));
      setCouponDiscount(discount);
      setCouponMessage('Coupon applied: 10% discount');
    } else {
      setCouponMessage('Invalid promotional code');
    }
  };

  const handleQtyChange = async (itemId, newQty) => {
    try {
      await updateCartItem({ itemId, qty: Number(newQty) }).unwrap();
    } catch (err) {
      console.error('Failed to update quantity:', err);
    }
  };

  const handleRemove = async (itemId) => {
    try {
      await removeCartItem(itemId).unwrap();
    } catch (err) {
      console.error('Failed to remove item:', err);
    }
  };

  return (
    <div className="bg-[#EAEDED] min-h-[calc(100vh-280px)] py-6">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6">
        {isLoading ? (
          <div className="bg-white p-8 border border-[#D5D9D9] rounded-[4px] space-y-4">
            <div className="h-7 w-48 bg-[#F0F2F2] skeleton rounded" />
            <div className="h-28 bg-[#F0F2F2] skeleton rounded" />
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white p-10 border border-[#D5D9D9] rounded-[4px] max-w-4xl mx-auto text-center">
            <h1 className="text-[24px] font-medium text-[#0F1111] mb-2">
              Your ShopSphere Cart is empty.
            </h1>
            <p className="text-[13px] text-[#565959] mb-6">
              Your shopping cart is waiting. Give it purpose — fill it with electronics, clothing, books, and more!
            </p>
            <Link to="/products">
              <Button variant="primary" size="form">
                Continue shopping
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left Column: Shopping Cart Items List (8 cols) */}
            <div className="lg:col-span-8 bg-white border border-[#D5D9D9] rounded-[4px] p-5">
              <div className="flex items-baseline justify-between pb-3 border-b border-[#D5D9D9]">
                <div>
                  <h1 className="text-[24px] font-normal text-[#0F1111]">
                    Shopping Cart
                  </h1>
                  <button
                    onClick={() => clearCart()}
                    className="text-[12px] text-[#007185] hover:text-[#C7511F] hover:underline"
                  >
                    Deselect / Clear all items
                  </button>
                </div>
                <div className="text-[13px] text-[#565959] hidden sm:block">
                  Price
                </div>
              </div>

              {/* Items List */}
              <div className="divide-y divide-[#D5D9D9]">
                {items.map((item) => {
                  const product = item.productId || {};
                  const productId = typeof item.productId === 'string' ? item.productId : product._id || product.id;
                  const title = item.title || product.title || product.name || 'ShopSphere Item';
                  const imageSrc =
                    item.image ||
                    product.images?.[0]?.url ||
                    product.images?.[0] ||
                    product.image ||
                    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80';
                  const price = Number(item.priceSnapshot ?? item.price ?? product.basePrice ?? 0);

                  return (
                    <div key={item._id || item.id} className="py-4 flex flex-col sm:flex-row gap-4">
                      {/* Product Image (180px) */}
                      <div className="w-full sm:w-[160px] h-[160px] shrink-0 bg-[#F0F2F2] rounded-[2px] flex items-center justify-center p-2">
                        <Link to={`/products/${productId}`}>
                          <img
                            src={imageSrc}
                            alt={title}
                            className="max-h-full max-w-full object-contain"
                          />
                        </Link>
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start gap-4">
                            <Link
                              to={`/products/${productId}`}
                              className="text-[16px] font-medium text-[#0F1111] hover:text-[#C7511F] line-clamp-2 leading-snug"
                            >
                              {title}
                            </Link>
                            <div className="shrink-0 text-right sm:hidden">
                              <Price amount={price * (item.qty || 1)} />
                            </div>
                          </div>

                          <div className="text-[12px] text-[#007600] mt-1 font-medium">
                            In Stock
                          </div>

                          <div className="text-[12px] text-[#565959] mt-0.5">
                            Eligible for FREE Shipping
                          </div>
                        </div>

                        {/* Bottom Actions: Qty dropdown, Delete, Save for later */}
                        <div className="flex flex-wrap items-center gap-3 pt-3 text-[12px]">
                          <div className="flex items-center gap-1.5 bg-[#F0F2F2] border border-[#D5D9D9] rounded-[3px] px-2 py-0.5">
                            <label htmlFor={`qty-${item._id}`} className="text-[#565959]">
                              Qty:
                            </label>
                            <select
                              id={`qty-${item._id}`}
                              value={item.qty || 1}
                              onChange={(e) => handleQtyChange(item._id, e.target.value)}
                              className="bg-transparent text-[#0F1111] font-semibold text-[13px] cursor-pointer focus:outline-none"
                            >
                              {Array.from({ length: 10 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>
                                  {i + 1}
                                </option>
                              ))}
                            </select>
                          </div>

                          <span className="text-[#D5D9D9]">|</span>

                          <button
                            type="button"
                            onClick={() => handleRemove(item._id)}
                            className="text-[#007185] hover:text-[#C7511F] hover:underline"
                          >
                            Delete
                          </button>

                          <span className="text-[#D5D9D9]">|</span>

                          <button
                            type="button"
                            className="text-[#007185] hover:text-[#C7511F] hover:underline"
                          >
                            Save for later
                          </button>

                          <span className="text-[#D5D9D9]">|</span>

                          <button
                            type="button"
                            className="text-[#007185] hover:text-[#C7511F] hover:underline"
                          >
                            Share
                          </button>
                        </div>
                      </div>

                      {/* Desktop Price */}
                      <div className="hidden sm:block shrink-0 text-right w-24">
                        <Price amount={price * (item.qty || 1)} size="md" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Subtotal bottom line */}
              <div className="pt-4 border-t border-[#D5D9D9] text-right text-[15px] text-[#0F1111]">
                Subtotal ({totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}):{' '}
                <strong className="font-semibold">
                  <Price amount={subtotal} />
                </strong>
              </div>
            </div>

            {/* Right Column: Sticky Subtotal Summary Card (4 cols) */}
            <div className="lg:col-span-4 space-y-4 sticky top-20">
              <div className="bg-white border border-[#D5D9D9] rounded-[4px] p-5 space-y-4">
                {/* Free Shipping Alert */}
                {amountToFreeShipping > 0 ? (
                  <div className="text-[13px] text-[#0F1111]">
                    Add{' '}
                    <strong className="text-[#007600] font-semibold">
                      ₹{Number(amountToFreeShipping).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </strong>{' '}
                    of eligible items to your order for <span className="text-[#007600] font-semibold">FREE Shipping</span>.
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-[13px] text-[#007600] font-medium">
                    <CheckCircle2 size={16} strokeWidth={2} />
                    <span>Your order qualifies for FREE Shipping.</span>
                  </div>
                )}

                {/* Subtotal */}
                <div className="text-[18px] text-[#0F1111]">
                  Subtotal ({totalItemCount} items):{' '}
                  <strong className="font-semibold">
                    <Price amount={subtotal - couponDiscount} size="lg" />
                  </strong>
                </div>

                {/* Proceed to checkout button */}
                <Button
                  variant="primary"
                  size="checkout"
                  fullWidth
                  onClick={() => navigate('/checkout')}
                >
                  Proceed to checkout
                </Button>

                {/* Promotional Coupon Code */}
                <div className="pt-2 border-t border-[#D5D9D9]">
                  <form onSubmit={handleApplyCoupon} className="space-y-2">
                    <label htmlFor="coupon" className="text-[12px] font-medium text-[#565959]">
                      Promotional or Gift Code:
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="coupon"
                        type="text"
                        placeholder="Enter code (e.g. SAVE10)"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="flex-1 h-[32px] px-2 text-[12px] border border-[#A6A6A6] rounded-[3px] focus:outline-none focus:border-[#E77600]"
                      />
                      <Button variant="secondary" size="compact" type="submit">
                        Apply
                      </Button>
                    </div>
                    {couponMessage && (
                      <span className={`text-[11px] ${couponDiscount > 0 ? 'text-[#007600]' : 'text-[#B12704]'}`}>
                        {couponMessage}
                      </span>
                    )}
                  </form>
                </div>
              </div>

              {/* Security Guarantee Note */}
              <div className="bg-white border border-[#D5D9D9] rounded-[4px] p-3 flex items-center gap-2.5 text-[12px] text-[#565959]">
                <ShieldCheck size={18} strokeWidth={1.75} className="text-[#007600] shrink-0" />
                <span>ShopSphere 100% Purchase Protection & Secure 256-bit SSL transaction</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
