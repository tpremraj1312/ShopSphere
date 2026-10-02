import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  useGetAddressesQuery,
  useAddAddressMutation,
  useCreateCheckoutOrderMutation,
} from '../../store/orderApi';
import { useGetCartQuery } from '../../store/cartApi';
import Price from '../../components/ui/Price';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Lock, Check, Plus, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const { data: cartData, isLoading: isCartLoading } = useGetCartQuery();
  const { data: addressesData, isLoading: isAddressLoading } = useGetAddressesQuery();
  const [addAddress, { isLoading: isAddingAddress }] = useAddAddressMutation();
  const [createCheckoutOrder, { isLoading: isPlacingOrder }] = useCreateCheckoutOrderMutation();

  const cart = cartData?.data;
  const items = cart?.items || [];
  const addresses = addressesData?.data || [];

  // Active accordion step: 1 (Address), 2 (Payment), 3 (Review)
  const [activeStep, setActiveStep] = useState(1);

  // Address selection
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
    isDefault: false,
  });

  // Payment selection
  const [paymentMethod, setPaymentMethod] = useState('card');

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [error, setError] = useState(null);

  // Auto-select default address
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
      setSelectedAddressId(defaultAddr._id);
    }
  }, [addresses, selectedAddressId]);

  // Idempotency key per session/checkout
  const [idempotencyKey] = useState(() => {
    return 'idem-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now();
  });

  // Calculate totals
  const subtotal = cart?.subtotal || 0;
  const shipping = subtotal >= 35 || subtotal === 0 ? 0 : 5.99;
  const tax = Number((subtotal * 0.08).toFixed(2));
  const total = Math.max(0, Number((subtotal + tax + shipping - couponDiscount).toFixed(2)));

  const selectedAddress = addresses.find((a) => a._id === selectedAddressId);

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    setError(null);
    const code = couponCode.trim().toUpperCase();
    if (code === 'WELCOME10') {
      const disc = Math.min(50, subtotal * 0.1);
      setCouponDiscount(Number(disc.toFixed(2)));
      setAppliedCoupon('WELCOME10');
    } else if (code === 'SAVE10') {
      setCouponDiscount(Number((subtotal * 0.1).toFixed(2)));
      setAppliedCoupon('SAVE10');
    } else {
      setError('Invalid promotion code. Try SAVE10 or WELCOME10.');
    }
  };

  const handleCreateAddress = async (e) => {
    e.preventDefault();
    try {
      const res = await addAddress(newAddress).unwrap();
      setShowNewAddressForm(false);
      setNewAddress({
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'United States',
        isDefault: false,
      });
      if (res?.data?._id) {
        setSelectedAddressId(res.data._id);
      }
    } catch (err) {
      setError(err.data?.error?.message || 'Failed to save address.');
    }
  };

  const handlePlaceOrder = async () => {
    setError(null);
    if (!selectedAddressId) {
      setError('Please select or add a delivery address.');
      setActiveStep(1);
      return;
    }

    try {
      const orderPayload = {
        shippingAddressId: selectedAddressId,
        paymentMethod,
        couponCode: appliedCoupon || undefined,
        idempotencyKey,
      };

      const res = await createCheckoutOrder(orderPayload).unwrap();
      const order = res?.data?.order || res?.data;
      const orderId = order?._id || order?.id;

      if (orderId) {
        if (paymentMethod === 'cod') {
          navigate(`/checkout/success/${orderId}`);
        } else {
          navigate(`/checkout/payment/${orderId}`);
        }
      } else {
        navigate('/orders');
      }
    } catch (err) {
      setError(err.data?.error?.message || 'Failed to place order. Please review your details.');
    }
  };

  return (
    <div className="bg-[#EAEDED] min-h-screen">
      {/* Section 6.2: Minimal Checkout Header (Logo + Lock + Checkout label) */}
      <header className="bg-white border-b border-[#D5D9D9] py-3.5 px-6 sticky top-0 z-30">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="text-[22px] font-semibold text-[#0F1111] hover:text-[#C7511F] tracking-tight"
          >
            ShopSphere
          </Link>
          <div className="flex items-center gap-2 text-[20px] font-normal text-[#0F1111]">
            <span>Checkout</span>
            <span className="text-[#565959] text-[16px]">
              ({items.length} {items.length === 1 ? 'item' : 'items'})
            </span>
          </div>
          <div className="text-[#565959] flex items-center gap-1.5 text-[14px]">
            <Lock size={16} strokeWidth={2} />
          </div>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-[#FFF0F0] border-l-4 border-l-[#B12704] border border-[#D5D9D9] rounded-[3px] text-[#B12704] text-[13px]">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: 3-Step Accordion (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {/* ================= STEP 1: Delivery Address ================= */}
            <div className="bg-white border border-[#D5D9D9] rounded-[4px] p-5">
              <div className="flex items-center justify-between pb-2">
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold ${activeStep > 1 ? 'bg-[#007600] text-white' : 'bg-[#FFD814] text-[#0F1111]'
                    }`}>
                    {activeStep > 1 ? <Check size={16} strokeWidth={2.5} /> : '1'}
                  </span>
                  <h2 className="text-[17px] font-semibold text-[#0F1111]">
                    Choose a delivery address
                  </h2>
                </div>
                {activeStep > 1 && (
                  <button
                    onClick={() => setActiveStep(1)}
                    className="text-[13px] text-[#007185] hover:text-[#C7511F] hover:underline"
                  >
                    Change
                  </button>
                )}
              </div>

              {activeStep === 1 ? (
                <div className="mt-4 pt-4 border-t border-[#D5D9D9] space-y-4">
                  {addresses.length === 0 && !showNewAddressForm ? (
                    <div className="text-[13px] text-[#565959]">
                      No shipping addresses saved on file. Please add an address below.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {addresses.map((addr) => {
                        const isSelected = selectedAddressId === addr._id;
                        return (
                          <label
                            key={addr._id}
                            className={`flex items-start gap-3 p-3.5 border rounded-[3px] cursor-pointer transition-colors ${isSelected
                                ? 'border-[#E77600] bg-[#FFF8F2]'
                                : 'border-[#D5D9D9] hover:border-[#A6A6A6] bg-white'
                              }`}
                          >
                            <input
                              type="radio"
                              name="shippingAddress"
                              checked={isSelected}
                              onChange={() => setSelectedAddressId(addr._id)}
                              className="mt-1 text-[#007185] focus:ring-[#007185]"
                            />
                            <div className="text-[13px] text-[#0F1111] leading-relaxed">
                              <span className="font-semibold">{user?.name || 'Customer'}</span>
                              <div>{addr.street}</div>
                              <div>
                                {addr.city}, {addr.state} {addr.postalCode}
                              </div>
                              <div className="text-[#565959]">{addr.country}</div>
                              {addr.isDefault && (
                                <span className="inline-block mt-1 text-[11px] bg-[#F0F2F2] border border-[#D5D9D9] px-1.5 py-0.5 rounded-[2px] text-[#565959]">
                                  Default address
                                </span>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {/* Add New Address Accordion / Toggle */}
                  {showNewAddressForm ? (
                    <form onSubmit={handleCreateAddress} className="mt-4 p-4 border border-[#D5D9D9] rounded-[3px] bg-[#F7FAFA] space-y-3">
                      <h3 className="text-[14px] font-semibold text-[#0F1111]">Add a new address</h3>
                      <Input
                        label="Street address"
                        required
                        value={newAddress.street}
                        onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          label="City"
                          required
                          value={newAddress.city}
                          onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        />
                        <Input
                          label="State / Province"
                          required
                          value={newAddress.state}
                          onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          label="ZIP / Postal code"
                          required
                          value={newAddress.postalCode}
                          onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                        />
                        <Input
                          label="Country"
                          required
                          value={newAddress.country}
                          onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button variant="primary" size="compact" type="submit" disabled={isAddingAddress}>
                          Save Address
                        </Button>
                        <Button variant="secondary" size="compact" type="button" onClick={() => setShowNewAddressForm(false)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowNewAddressForm(true)}
                      className="inline-flex items-center gap-1.5 text-[13px] text-[#007185] hover:text-[#C7511F] hover:underline pt-1"
                    >
                      <Plus size={16} strokeWidth={2} />
                      Add a new delivery address
                    </button>
                  )}

                  <div className="pt-3">
                    <Button
                      variant="primary"
                      size="form"
                      disabled={!selectedAddressId}
                      onClick={() => setActiveStep(2)}
                    >
                      Use this address
                    </Button>
                  </div>
                </div>
              ) : selectedAddress ? (
                <div className="text-[13px] text-[#565959] pl-10 mt-1">
                  {selectedAddress.street}, {selectedAddress.city}, {selectedAddress.state} {selectedAddress.postalCode}
                </div>
              ) : null}
            </div>

            {/* ================= STEP 2: Payment Method ================= */}
            <div className="bg-white border border-[#D5D9D9] rounded-[4px] p-5">
              <div className="flex items-center justify-between pb-2">
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold ${activeStep > 2 ? 'bg-[#007600] text-white' : activeStep === 2 ? 'bg-[#FFD814] text-[#0F1111]' : 'bg-[#F0F2F2] text-[#565959]'
                    }`}>
                    {activeStep > 2 ? <Check size={16} strokeWidth={2.5} /> : '2'}
                  </span>
                  <h2 className="text-[17px] font-semibold text-[#0F1111]">
                    Payment method
                  </h2>
                </div>
                {activeStep > 2 && (
                  <button
                    onClick={() => setActiveStep(2)}
                    className="text-[13px] text-[#007185] hover:text-[#C7511F] hover:underline"
                  >
                    Change
                  </button>
                )}
              </div>

              {activeStep === 2 ? (
                <div className="mt-4 pt-4 border-t border-[#D5D9D9] space-y-3">
                  <label className={`flex items-center gap-3 p-3.5 border rounded-[3px] cursor-pointer ${paymentMethod === 'card' ? 'border-[#E77600] bg-[#FFF8F2]' : 'border-[#D5D9D9]'
                    }`}>
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'card'}
                      onChange={() => setPaymentMethod('card')}
                      className="text-[#007185]"
                    />
                    <span className="text-[13px] font-medium text-[#0F1111]">
                      Credit / Debit Card (Stripe Gateway)
                    </span>
                  </label>

                  <label className={`flex items-center gap-3 p-3.5 border rounded-[3px] cursor-pointer ${paymentMethod === 'cod' ? 'border-[#E77600] bg-[#FFF8F2]' : 'border-[#D5D9D9]'
                    }`}>
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="text-[#007185]"
                    />
                    <span className="text-[13px] font-medium text-[#0F1111]">
                      Cash on Delivery (Pay upon arrival)
                    </span>
                  </label>

                  <div className="pt-2">
                    <Button
                      variant="primary"
                      size="form"
                      onClick={() => setActiveStep(3)}
                    >
                      Use this payment method
                    </Button>
                  </div>
                </div>
              ) : activeStep > 2 ? (
                <div className="text-[13px] text-[#565959] pl-10 mt-1">
                  {paymentMethod === 'card' ? 'Credit / Debit Card' : 'Cash on Delivery'}
                </div>
              ) : null}
            </div>

            {/* ================= STEP 3: Review items and delivery ================= */}
            <div className="bg-white border border-[#D5D9D9] rounded-[4px] p-5">
              <div className="flex items-center gap-3 pb-2">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold ${activeStep === 3 ? 'bg-[#FFD814] text-[#0F1111]' : 'bg-[#F0F2F2] text-[#565959]'
                  }`}>
                  3
                </span>
                <h2 className="text-[17px] font-semibold text-[#0F1111]">
                  Review items and shipping
                </h2>
              </div>

              {activeStep === 3 && (
                <div className="mt-4 pt-4 border-t border-[#D5D9D9] space-y-4">
                  <div className="text-[13px] text-[#007600] font-medium">
                    Guaranteed Delivery: Tomorrow by 8:00 PM
                  </div>

                  <div className="divide-y divide-[#D5D9D9]">
                    {items.map((item) => {
                      const product = item.productId || {};
                      const title = item.title || product.title || product.name || 'ShopSphere Product';
                      const imageSrc =
                        item.image ||
                        product.images?.[0]?.url ||
                        product.images?.[0] ||
                        product.image ||
                        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80';
                      const price = Number(item.priceSnapshot ?? item.price ?? product.basePrice ?? 0);

                      return (
                        <div key={item._id || item.id} className="py-3 flex items-center gap-4">
                          <img
                            src={imageSrc}
                            alt={title}
                            className="w-14 h-14 object-contain bg-[#F0F2F2] border border-[#D5D9D9] rounded-[2px] p-1 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-[13px] font-medium text-[#0F1111] truncate">{title}</h4>
                            <div className="text-[12px] text-[#565959]">Quantity: {item.qty || 1}</div>
                          </div>
                          <div className="text-right">
                            <Price amount={price * (item.qty || 1)} size="sm" />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Place Order CTA Inside Review Step */}
                  <div className="pt-4 border-t border-[#D5D9D9] flex items-center justify-between">
                    <div>
                      <div className="text-[14px] font-semibold text-[#0F1111]">
                        Order Total: <Price amount={total} size="md" />
                      </div>
                      <div className="text-[11px] text-[#565959]">
                        By placing your order, you agree to ShopSphere's conditions of use.
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      size="checkout"
                      disabled={isPlacingOrder}
                      onClick={handlePlaceOrder}
                    >
                      {isPlacingOrder ? 'Placing order...' : 'Place your order'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Sticky Order Summary Box (4 cols) */}
          <div className="lg:col-span-4 sticky top-20">
            <div className="bg-white border border-[#D5D9D9] rounded-[4px] p-5 space-y-4">
              <Button
                variant="primary"
                size="checkout"
                fullWidth
                disabled={isPlacingOrder || !selectedAddressId}
                onClick={handlePlaceOrder}
              >
                {isPlacingOrder ? 'Processing...' : 'Place your order'}
              </Button>

              <div className="text-[11px] text-[#565959] text-center leading-tight">
                By placing your order, you agree to ShopSphere's privacy notice and conditions of use.
              </div>

              <div className="pt-3 border-t border-[#D5D9D9] space-y-2 text-[13px] text-[#0F1111]">
                <h3 className="font-semibold text-[14px]">Order Summary</h3>
                <div className="flex justify-between">
                  <span className="text-[#565959]">Items ({items.length}):</span>
                  <Price amount={subtotal} size="sm" />
                </div>
                <div className="flex justify-between">
                  <span className="text-[#565959]">Shipping & handling:</span>
                  <Price amount={shipping} size="sm" />
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-[#007600]">
                    <span>Promotion applied:</span>
                    <span>-<Price amount={couponDiscount} size="sm" /></span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#565959]">Estimated tax:</span>
                  <Price amount={tax} size="sm" />
                </div>
                <div className="pt-3 border-t border-[#D5D9D9] flex justify-between items-baseline text-[16px] font-semibold text-[#B12704]">
                  <span className="text-[#0F1111]">Order Total:</span>
                  <Price amount={total} size="lg" />
                </div>
              </div>

              {/* Coupon Form */}
              <div className="pt-2 border-t border-[#D5D9D9]">
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Gift card or promo"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 h-[32px] px-2 text-[12px] border border-[#A6A6A6] rounded-[3px] focus:outline-none focus:border-[#E77600]"
                  />
                  <Button variant="secondary" size="compact" type="submit">
                    Apply
                  </Button>
                </form>
                {appliedCoupon && (
                  <div className="text-[11px] text-[#007600] mt-1">
                    Code {appliedCoupon} applied.
                  </div>
                )}
              </div>

              {/* Security info */}
              <div className="pt-2 border-t border-[#D5D9D9] flex items-center gap-2 text-[12px] text-[#565959]">
                <ShieldCheck size={16} strokeWidth={1.75} className="text-[#007600]" />
                <span>ShopSphere 100% Purchase Protection</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
