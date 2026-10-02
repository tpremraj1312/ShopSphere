import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  useGetOrderByIdQuery,
  useCreatePaymentIntentMutation,
  useVerifyPaymentMutation,
  useGetPaymentStatusQuery,
  useGetAddressesQuery,
  useUpdateOrderAddressMutation,
  useAddAddressMutation,
  useConfirmCodOrderMutation,
} from '../../store/orderApi';
import Price from '../../components/ui/Price';
import Button from '../../components/ui/Button';
import {
  ShieldCheck,
  MapPin,
  Plus,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Banknote,
  CreditCard,
  Smartphone,
  Building2,
  AlertCircle,
  Check,
} from 'lucide-react';

const FIELD =
  'w-full h-[38px] px-3 text-[16px] sm:text-[14px] text-[#0F1111] bg-white border border-[#888C8C] rounded-[3px] ' +
  'shadow-[inset_0_1px_2px_rgba(15,17,17,0.15)] placeholder:text-[#8D9096] focus:outline-none ' +
  'focus:border-[#E77600] focus:shadow-[0_0_3px_2px_rgba(228,121,17,0.5)]';

const PAYMENT_OPTIONS = [
  { value: 'upi', Icon: Smartphone, title: 'UPI', note: 'GPay, PhonePe, Paytm, QR' },
  { value: 'card', Icon: CreditCard, title: 'Credit / Debit card', note: 'Visa, MasterCard, RuPay' },
  { value: 'netbanking', Icon: Building2, title: 'Net banking', note: 'All major Indian banks' },
  { value: 'cod', Icon: Banknote, title: 'Cash on delivery', note: 'Pay when it arrives', tag: 'Pay on delivery' },
];

function Field({ label, className = '', children }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-[13px] font-bold text-[#0F1111] mb-1">{label}</span>
      {children}
    </label>
  );
}

function StepHeading({ step, title, action }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2.5 text-[18px] font-bold text-[#0F1111]">
        <span className="w-6 h-6 rounded-full bg-[#232F3E] text-white text-[13px] font-bold flex items-center justify-center shrink-0">
          {step}
        </span>
        {title}
      </h2>
      {action}
    </div>
  );
}

export default function PaymentPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const { data: orderData, refetch: refetchOrder } = useGetOrderByIdQuery(orderId);
  const { data: addressesData } = useGetAddressesQuery();
  const [createIntent] = useCreatePaymentIntentMutation();
  const [verifyPayment] = useVerifyPaymentMutation();
  const [confirmCodOrder, { isLoading: isConfirmingCod }] = useConfirmCodOrderMutation();
  const [updateOrderAddress, { isLoading: isUpdatingAddress }] = useUpdateOrderAddressMutation();
  const [addAddress, { isLoading: isAddingAddress }] = useAddAddressMutation();

  // Polling query every 2 seconds for payment status (fallback confirmation)
  const { data: statusData } = useGetPaymentStatusQuery(orderId, {
    pollingInterval: 2000,
  });

  const [intentData, setIntentData] = useState(null);
  const [paymentState, setPaymentState] = useState('idle');
  const [errorMessage, setErrorMessage] = useState(null);
  const [razorpayReady, setRazorpayReady] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('upi');

  // Address editing states
  const [isChangingAddress, setIsChangingAddress] = useState(false);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [addressSuccessMsg, setAddressSuccessMsg] = useState(null);
  const [newAddress, setNewAddress] = useState({
    name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    isDefault: false,
  });

  const intentRequestedFor = useRef(null);
  const order = orderData?.data;
  const addresses = addressesData?.data || [];
  const shippingAddress = order?.shippingAddress;

  // Load Razorpay checkout script
  useEffect(() => {
    if (window.Razorpay) {
      setRazorpayReady(true);
      return undefined;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayReady(true);
    script.onerror = () =>
      setErrorMessage('The Razorpay checkout could not be loaded. Please check your connection and try again.');
    document.body.appendChild(script);
    return () => script.remove();
  }, []);

  // Create the Razorpay order once
  useEffect(() => {
    if (!orderId || intentRequestedFor.current === orderId) return;
    intentRequestedFor.current = orderId;

    createIntent(orderId)
      .unwrap()
      .then((res) => {
        setIntentData(res.data);
      })
      .catch((err) => {
        setErrorMessage(err?.data?.message || 'Failed to initialize payment gateway');
      });
  }, [orderId, createIntent]);

  // Polling detected a completed payment
  useEffect(() => {
    if (statusData?.data?.paymentStatus === 'completed' || order?.payment?.status === 'completed') {
      setPaymentState('confirmed');
    }
  }, [statusData, order]);

  // Redirect shortly after confirmation
  useEffect(() => {
    if (paymentState !== 'confirmed') return undefined;
    const timer = setTimeout(() => {
      navigate(`/checkout/success/${orderId}`);
    }, 1200);
    return () => clearTimeout(timer);
  }, [paymentState, navigate, orderId]);

  const confirmWithServer = async (rzpResponse = {}) => {
    setErrorMessage(null);
    setPaymentState('processing');

    try {
      await verifyPayment({
        orderId,
        razorpay_order_id: rzpResponse.razorpay_order_id,
        razorpay_payment_id: rzpResponse.razorpay_payment_id,
        razorpay_signature: rzpResponse.razorpay_signature,
      }).unwrap();
      setPaymentState('confirmed');
    } catch (err) {
      setPaymentState('failed');
      setErrorMessage(err?.data?.message || 'Payment verification failed. If money was deducted, contact support.');
    }
  };

  const handleSelectAddress = async (addr) => {
    setErrorMessage(null);
    try {
      await updateOrderAddress({
        orderId,
        shippingAddressId: addr._id,
      }).unwrap();
      setIsChangingAddress(false);
      setAddressSuccessMsg('Delivery address updated!');
      refetchOrder();
      setTimeout(() => setAddressSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMessage(err?.data?.error?.message || err?.data?.message || 'Failed to update delivery address.');
    }
  };

  const handleAddNewAddress = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      const res = await addAddress(newAddress).unwrap();
      setShowNewAddressForm(false);
      const created = Array.isArray(res?.data) ? res.data[res.data.length - 1] : res?.data;
      if (created?._id) {
        await updateOrderAddress({
          orderId,
          shippingAddressId: created._id,
        }).unwrap();
      }
      setIsChangingAddress(false);
      setAddressSuccessMsg('New delivery address added and selected!');
      refetchOrder();
      setTimeout(() => setAddressSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMessage(err?.data?.error?.message || err?.data?.message || 'Failed to save address.');
    }
  };

  const handlePayment = async () => {
    setErrorMessage(null);

    // Cash on Delivery handler
    if (selectedMethod === 'cod') {
      setPaymentState('processing');
      try {
        await confirmCodOrder(orderId).unwrap();
        setPaymentState('confirmed');
      } catch (err) {
        setPaymentState('failed');
        setErrorMessage(err?.data?.error?.message || err?.data?.message || 'Failed to place Cash on Delivery order.');
      }
      return;
    }

    // Razorpay flow
    if (!intentData) {
      setErrorMessage('Payment is still being set up. Please try again in a moment.');
      return;
    }

    if (intentData.isSandbox) {
      confirmWithServer();
      return;
    }

    if (!razorpayReady || !window.Razorpay || !intentData.keyId) {
      setErrorMessage('Payment gateway is still loading. Please try again in a moment.');
      return;
    }

    const checkout = new window.Razorpay({
      key: intentData.keyId,
      amount: Math.round(Number(intentData.amount) * 100),
      currency: intentData.currency || 'INR',
      name: 'ShopSphere',
      description: `Order ${orderId}`,
      order_id: intentData.orderId,
      prefill: {
        email: order?.customerId?.email || '',
        method: selectedMethod,
      },
      notes: { orderId },
      handler: confirmWithServer,
      modal: {
        ondismiss: () => setPaymentState((s) => (s === 'processing' ? s : 'idle')),
      },
    });

    checkout.on('payment.failed', (response) => {
      setPaymentState('failed');
      setErrorMessage(response?.error?.description || 'Payment was declined. Please try another method.');
    });

    checkout.open();
  };

  const isTestMode = Boolean(intentData?.isSandbox || intentData?.keyId?.startsWith('rzp_test_'));

  // Presentation-only values
  const isConfirmed = paymentState === 'confirmed';
  const isBusy = paymentState === 'processing' || isConfirmingCod;
  const ctaDisabled = isBusy || (selectedMethod !== 'cod' && !intentData);
  const ctaLabel = isBusy
    ? 'Processing order...'
    : selectedMethod === 'cod'
      ? 'Place your order'
      : intentData?.isSandbox
        ? 'Pay with test sandbox'
        : 'Pay now';

  const renderOption = ({ value, Icon, title, note, tag }) => {
    const selected = selectedMethod === value;
    return (
      <button
        key={value}
        type="button"
        role="radio"
        aria-checked={selected}
        onClick={() => setSelectedMethod(value)}
        className={`relative flex items-center gap-3 min-h-[76px] p-3 text-left border rounded-[8px] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E77600] ${selected
            ? 'border-[#E77600] bg-[#FFF8F0] shadow-[0_0_0_1px_#E77600]'
            : 'border-[#D5D9D9] bg-white hover:border-[#A6A6A6] hover:shadow-sm'
          }`}
      >
        <span
          className={`w-10 h-10 rounded-[8px] flex items-center justify-center shrink-0 ${selected ? 'bg-white text-[#C45500] border border-[#F3D2B0]' : 'bg-[#F0F2F2] text-[#565959]'
            }`}
        >
          <Icon size={22} strokeWidth={1.5} />
        </span>
        <span className="min-w-0 pr-5">
          <span className="block text-[14px] font-bold text-[#0F1111] leading-[18px]">{title}</span>
          <span className="block text-[12px] text-[#565959] leading-4 mt-0.5">{note}</span>
          {tag && (
            <span className="inline-block mt-1 text-[10px] font-bold text-[#067D62] bg-[#E7F4E8] px-1.5 py-px rounded-[3px]">
              {tag}
            </span>
          )}
        </span>
        {selected && (
          <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#E77600] text-white flex items-center justify-center">
            <Check size={12} strokeWidth={3} />
          </span>
        )}
      </button>
    );
  };

  const PayButton = ({ className = '' }) => (
    <Button
      variant="primary"
      size="checkout"
      fullWidth
      className={className}
      disabled={ctaDisabled}
      onClick={handlePayment}
    >
      {ctaLabel}
    </Button>
  );

  return (
    <div className="bg-[#EAEDED] min-h-screen pb-28 lg:pb-8">
      <div className="max-w-4xl mx-auto px-4 pt-5">
        {/* Alerts */}
        <div aria-live="polite" className="space-y-3 mb-4 empty:mb-0">
          {errorMessage && (
            <div role="alert" className="flex items-start gap-2.5 p-3.5 bg-white border border-[#CC0C39] rounded-[8px]">
              <AlertCircle size={20} className="text-[#CC0C39] shrink-0 mt-px" />
              <div>
                <div className="text-[14px] font-bold text-[#B12704]">There was a problem</div>
                <div className="text-[13px] text-[#0F1111]">{errorMessage}</div>
              </div>
            </div>
          )}

          {addressSuccessMsg && (
            <div className="flex items-center gap-2.5 p-3.5 bg-white border border-[#067D62] rounded-[8px]">
              <CheckCircle2 size={20} className="text-[#067D62] shrink-0" />
              <span className="text-[13px] font-bold text-[#067D62]">{addressSuccessMsg}</span>
            </div>
          )}
        </div>

        <div className={`grid gap-4 items-start ${isConfirmed ? 'max-w-2xl mx-auto' : 'lg:grid-cols-[minmax(0,1fr)_290px]'}`}>
          {/* Left column */}
          <div className="space-y-4 min-w-0">
            {/* 1. Delivery address */}
            <section className="bg-white border border-[#D5D9D9] rounded-[8px] p-4 space-y-3">
              <StepHeading
                step={1}
                title="Delivery address"
                action={
                  <button
                    type="button"
                    onClick={() => setIsChangingAddress(!isChangingAddress)}
                    aria-expanded={isChangingAddress}
                    className="inline-flex items-center gap-1 text-[13px] text-[#007185] hover:text-[#C7511F] hover:underline shrink-0"
                  >
                    {isChangingAddress ? (
                      <>
                        Hide <ChevronUp size={15} />
                      </>
                    ) : (
                      <>
                        Change <ChevronDown size={15} />
                      </>
                    )}
                  </button>
                }
              />

              {shippingAddress ? (
                <div className="flex items-start gap-3 text-[13px] text-[#0F1111] leading-5">
                  <MapPin size={18} strokeWidth={1.5} className="text-[#565959] shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div>
                      <span className="font-bold">
                        {shippingAddress.fullName || shippingAddress.name || 'Recipient'}
                      </span>
                      <span className="text-[#565959]"> · Phone: {shippingAddress.phone || '9876543210'}</span>
                    </div>
                    <div className="text-[#333333]">
                      {shippingAddress.addressLine1 || shippingAddress.street}
                      {shippingAddress.addressLine2 && `, ${shippingAddress.addressLine2}`}, {shippingAddress.city},{' '}
                      {shippingAddress.state} - {shippingAddress.postalCode}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 text-[13px] text-[#565959]">
                  <MapPin size={18} strokeWidth={1.5} className="shrink-0 mt-0.5" />
                  <span>No address linked yet. Choose or add a delivery address.</span>
                </div>
              )}

              {isChangingAddress && (
                <div className="pt-3 border-t border-[#D5D9D9] space-y-3">
                  {addresses.length > 0 && (
                    <>
                      <div className="text-[13px] font-bold text-[#0F1111]">Your saved addresses</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {addresses.map((addr) => (
                          <button
                            key={addr._id}
                            type="button"
                            onClick={() => handleSelectAddress(addr)}
                            disabled={isUpdatingAddress}
                            className="flex flex-col items-start gap-0.5 p-3 text-left bg-white border border-[#D5D9D9] rounded-[8px] hover:border-[#007185] hover:bg-[#F7FAFA] disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E77600]"
                          >
                            <span className="text-[13px] font-bold text-[#0F1111]">{addr.name || 'Recipient'}</span>
                            <span className="text-[12px] text-[#565959] leading-4">
                              {addr.street}, {addr.city} - {addr.postalCode}
                            </span>
                            <span className="text-[12px] text-[#007185] mt-1">Deliver here</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {!showNewAddressForm ? (
                    <button
                      type="button"
                      onClick={() => setShowNewAddressForm(true)}
                      className="inline-flex items-center gap-1.5 text-[13px] text-[#007185] hover:text-[#C7511F] hover:underline"
                    >
                      <Plus size={15} /> Add a new address
                    </button>
                  ) : (
                    <form
                      onSubmit={handleAddNewAddress}
                      className="space-y-3 p-3.5 bg-[#F7F8F8] border border-[#D5D9D9] rounded-[8px]"
                    >
                      <div className="text-[14px] font-bold text-[#0F1111]">Add a new address</div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Field label="Full name">
                          <input
                            type="text"
                            required
                            autoComplete="name"
                            value={newAddress.name}
                            onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                            className={FIELD}
                          />
                        </Field>
                        <Field label="Mobile number">
                          <input
                            type="tel"
                            required
                            autoComplete="tel"
                            inputMode="tel"
                            value={newAddress.phone}
                            onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                            className={FIELD}
                          />
                        </Field>
                      </div>

                      <Field label="Street address">
                        <input
                          type="text"
                          required
                          autoComplete="street-address"
                          placeholder="House no., building, street, area"
                          value={newAddress.street}
                          onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                          className={FIELD}
                        />
                      </Field>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <Field label="City">
                          <input
                            type="text"
                            required
                            autoComplete="address-level2"
                            value={newAddress.city}
                            onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                            className={FIELD}
                          />
                        </Field>
                        <Field label="State">
                          <input
                            type="text"
                            required
                            autoComplete="address-level1"
                            value={newAddress.state}
                            onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                            className={FIELD}
                          />
                        </Field>
                        <Field label="PIN code" className="col-span-2 sm:col-span-1">
                          <input
                            type="text"
                            required
                            inputMode="numeric"
                            autoComplete="postal-code"
                            value={newAddress.postalCode}
                            onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                            className={FIELD}
                          />
                        </Field>
                      </div>

                      <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-2 sm:gap-4 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowNewAddressForm(false)}
                          className="text-[13px] text-[#007185] hover:text-[#C7511F] hover:underline py-2 sm:py-0"
                        >
                          Cancel
                        </button>
                        <Button type="submit" variant="primary" size="sm" disabled={isAddingAddress || isUpdatingAddress}>
                          {isAddingAddress ? 'Saving...' : 'Save and deliver here'}
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </section>

            {/* 2. Payment method / confirmation */}
            {isConfirmed ? (
              <section className="bg-white border border-[#D5D9D9] rounded-[8px] px-5 py-10 text-center">
                <div className="w-14 h-14 rounded-full bg-[#067D62] text-white flex items-center justify-center mx-auto">
                  <Check size={30} strokeWidth={3} />
                </div>
                <h2 className="mt-4 text-[22px] font-normal text-[#0F1111]">
                  {selectedMethod === 'cod' ? 'Order placed' : 'Payment confirmed'}
                </h2>
                <p className="mt-1 text-[14px] text-[#565959]">Taking you to your order confirmation...</p>
              </section>
            ) : (
              <section className="bg-white border border-[#D5D9D9] rounded-[8px] p-4 space-y-3">
                <StepHeading
                  step={2}
                  title="Payment method"
                  action={
                    isTestMode && (
                      <span className="text-[12px] text-[#565959] bg-[#F0F2F2] border border-[#D5D9D9] px-2 py-0.5 rounded-[3px] shrink-0">
                        Test mode
                      </span>
                    )
                  }
                />

                <div role="radiogroup" aria-label="Payment method" className="grid grid-cols-2 gap-2.5">
                  {PAYMENT_OPTIONS.map(renderOption)}
                </div>

                {/* Context note for the selected method */}
                <div className="flex items-center gap-2 px-3 py-2.5 bg-[#F7F8F8] border border-[#E7E7E7] rounded-[6px] text-[12px] text-[#0F1111] leading-4">
                  {selectedMethod === 'cod' ? (
                    <>
                      <CheckCircle2 size={16} className="text-[#067D62] shrink-0" />
                      <span>Pay with cash or UPI QR when your package arrives. Nothing to pay now.</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={16} className="text-[#067D62] shrink-0" />
                      <span>Pay securely through Razorpay. ShopSphere never stores your card or bank details.</span>
                    </>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* Right column: order summary (desktop) */}
          {!isConfirmed && (
            <aside className="hidden lg:block lg:sticky lg:top-4">
              <div className="bg-white border border-[#D5D9D9] rounded-[8px] overflow-hidden">
                <div className="p-4 space-y-2.5">
                  <PayButton />
                  <p className="text-[11px] text-[#565959] text-center leading-4">
                    By placing your order, you agree to ShopSphere's terms of use and privacy notice.
                  </p>
                </div>

                <div className="px-4 py-3 bg-[#F7F8F8] border-t border-[#D5D9D9] space-y-1.5">
                  <h2 className="text-[15px] font-bold text-[#0F1111]">Order summary</h2>
                  <div className="flex items-start justify-between gap-3 text-[12px]">
                    <span className="text-[#565959]">Order</span>
                    <span className="font-mono text-[#0F1111] break-all text-right">{orderId}</span>
                  </div>
                </div>

                <div className="px-4 py-3.5 border-t border-[#D5D9D9] flex items-center justify-between">
                  <span className="text-[17px] font-bold text-[#B12704]">Order total</span>
                  <span className="text-[#B12704]">
                    <Price amount={order?.pricing?.total ?? 0} size="lg" />
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 mt-3 text-[12px] text-[#565959]">
                <ShieldCheck size={16} strokeWidth={1.75} className="text-[#067D62]" />
                <span>100% Purchase Protection · ShopSphere Safe Checkout</span>
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* Mobile sticky pay bar */}
      {!isConfirmed && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-[#D5D9D9] shadow-[0_-2px_8px_rgba(15,17,17,0.12)] px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <div className="min-w-0">
                <div className="text-[12px] text-[#565959]">Order total</div>
                <div className="font-mono text-[11px] text-[#8D9096] truncate max-w-[10rem]">#{orderId}</div>
              </div>
              <span className="text-[#B12704]">
                <Price amount={order?.pricing?.total ?? 0} size="lg" />
              </span>
            </div>
            <PayButton />
          </div>
        </div>
      )}
    </div>
  );
}