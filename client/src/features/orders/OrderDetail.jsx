import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGetOrderByIdQuery, useCancelOrderMutation } from '../../store/orderApi';
import Price from '../../components/ui/Price';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Stepper from '../../components/ui/Stepper';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import Modal from '../../components/ui/Modal';
import { AlertCircle } from 'lucide-react';

export default function OrderDetail() {
  const { id } = useParams();
  const { data, isLoading, error } = useGetOrderByIdQuery(id);
  const [cancelOrder, { isLoading: isCancelling }] = useCancelOrderMutation();

  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [actionError, setActionError] = useState(null);

  const order = data?.data;

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    setActionError(null);
    try {
      await cancelOrder({
        orderId: id,
        reason: cancelReason || 'Customer requested cancellation',
      }).unwrap();
      setShowCancelModal(false);
    } catch (err) {
      setActionError(err?.data?.message || 'Failed to cancel order.');
    }
  };

  const getStepIndex = (status) => {
    switch (status) {
      case 'confirmed':
        return 1;
      case 'packed':
        return 1;
      case 'shipped':
        return 2;
      case 'delivered':
        return 3;
      case 'cancelled':
        return -1;
      default:
        return 0;
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-8 space-y-4">
        <div className="h-6 w-48 bg-[#F0F2F2] skeleton rounded" />
        <div className="h-44 bg-white border border-[#D5D9D9] skeleton rounded" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h2 className="text-[20px] font-semibold text-[#0F1111] mb-2">Order Not Found</h2>
        <p className="text-[13px] text-[#565959] mb-4">Unable to locate order #{id}.</p>
        <Link to="/orders">
          <Button variant="primary" size="compact">Return to Your Orders</Button>
        </Link>
      </div>
    );
  }

  const isCancellable = order.subOrders?.some((sub) =>
    ['pending', 'confirmed'].includes(sub.status)
  );

  const dateStr = new Date(order.createdAt || Date.now()).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="bg-[#EAEDED] min-h-[calc(100vh-280px)] py-6">
      <div className="max-w-[1200px] mx-auto px-4 space-y-4">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Your Orders', href: '/orders' },
            { label: `Order #${id}` },
          ]}
        />

        {/* Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-2">
          <div>
            <h1 className="text-[24px] font-normal text-[#0F1111]">Order Details</h1>
            <div className="text-[13px] text-[#565959] mt-0.5">
              Ordered on {dateStr} <span className="mx-1">|</span> Order # <span className="font-mono text-[#0F1111]">{order._id}</span>
            </div>
          </div>
          <div className="text-[13px] text-[#007185] hover:text-[#C7511F] hover:underline cursor-pointer">
            Print invoice
          </div>
        </div>

        {/* 3-Card Summary Box */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white border border-[#D5D9D9] rounded-[4px] p-5">
          {/* Shipping Address */}
          <div className="space-y-1 text-[13px]">
            <h3 className="font-semibold text-[#0F1111] text-[14px]">Shipping Address</h3>
            <div className="text-[#0F1111] font-medium">{order.shippingAddress?.fullName || 'Customer'}</div>
            <div className="text-[#565959]">{order.shippingAddress?.addressLine1}</div>
            <div className="text-[#565959]">
              {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}
            </div>
            <div className="text-[#565959]">{order.shippingAddress?.country || 'United States'}</div>
          </div>

          {/* Payment Method */}
          <div className="space-y-1 text-[13px] md:border-l md:border-[#D5D9D9] md:pl-5">
            <h3 className="font-semibold text-[#0F1111] text-[14px]">Payment Method</h3>
            <div className="text-[#0F1111] font-medium capitalize">
              {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Credit / Debit Card (Stripe)'}
            </div>
            <div className="text-[12px] text-[#565959]">
              Status: <span className="capitalize text-[#007600] font-semibold">{order.paymentStatus || 'Completed'}</span>
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-1.5 text-[13px] md:border-l md:border-[#D5D9D9] md:pl-5">
            <h3 className="font-semibold text-[#0F1111] text-[14px]">Order Summary</h3>
            <div className="flex justify-between text-[#565959]">
              <span>Items Subtotal:</span>
              <Price amount={order.pricing?.subtotal || order.subtotal || 0} size="sm" />
            </div>
            <div className="flex justify-between text-[#565959]">
              <span>Shipping & Handling:</span>
              <Price amount={order.pricing?.shipping ?? order.pricing?.shippingFee ?? 0} size="sm" />
            </div>
            <div className="flex justify-between text-[#565959]">
              <span>Estimated Tax:</span>
              <Price amount={order.pricing?.tax || 0} size="sm" />
            </div>
            <div className="pt-2 border-t border-[#D5D9D9] flex justify-between font-semibold text-[15px] text-[#0F1111]">
              <span>Grand Total:</span>
              <Price amount={order.pricing?.total ?? order.pricing?.totalAmount ?? order.total ?? 0} size="md" />
            </div>
          </div>
        </div>

        {/* Packages / Sub-Orders */}
        <div className="space-y-4">
          {order.subOrders?.map((subOrder, idx) => {
            const stepIndex = getStepIndex(subOrder.status);
            const isDelivered = subOrder.status === 'delivered';
            const isCancelled = subOrder.status === 'cancelled';

            return (
              <div
                key={subOrder._id || idx}
                className="bg-white border border-[#D5D9D9] rounded-[4px] p-5 space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#D5D9D9] gap-2">
                  <div>
                    <h2 className="text-[18px] font-semibold text-[#0F1111]">
                      {isCancelled
                        ? 'Cancelled'
                        : isDelivered
                        ? 'Delivered'
                        : 'Preparing for Delivery'}
                    </h2>
                    <span className="text-[12px] text-[#565959]">
                      Package {idx + 1} of {order.subOrders.length}
                    </span>
                  </div>

                  {isCancellable && (
                    <Button
                      variant="secondary"
                      size="compact"
                      onClick={() => setShowCancelModal(true)}
                    >
                      Cancel items in order
                    </Button>
                  )}
                </div>

                {/* Status Stepper in --success green */}
                {!isCancelled && (
                  <div className="py-2 max-w-2xl">
                    <Stepper
                      steps={['Ordered', 'Shipped', 'Out for delivery', 'Delivered']}
                      currentStep={Math.max(stepIndex, 0)}
                    />
                  </div>
                )}

                {/* Items in this subOrder */}
                <div className="divide-y divide-[#D5D9D9]">
                  {subOrder.items.map((item) => {
                    const product = item.productId || {};
                    const title = item.title || product.title || product.name || 'ShopSphere Product';
                    const imageSrc =
                      item.image ||
                      product.images?.[0]?.url ||
                      product.images?.[0] ||
                      product.image ||
                      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80';

                    return (
                      <div
                        key={item.sku}
                        className="py-4 flex flex-col sm:flex-row items-start justify-between gap-4"
                      >
                        <div className="flex gap-4">
                          <img
                            src={imageSrc}
                            alt={title}
                            className="w-20 h-20 object-contain bg-[#F0F2F2] border border-[#D5D9D9] rounded-[2px] p-1 shrink-0"
                          />
                          <div className="space-y-1">
                            <Link
                              to={`/products/${product._id || item.productId}`}
                              className="text-[15px] font-medium text-[#007185] hover:text-[#C7511F] hover:underline line-clamp-2"
                            >
                              {title}
                            </Link>
                            <div className="text-[12px] text-[#565959]">
                              Sold by: <span className="text-[#0F1111]">{subOrder.sellerId?.businessName || 'Marketplace Seller'}</span>
                            </div>
                            <div className="text-[13px] font-semibold text-[#0F1111]">
                              <Price amount={item.unitPrice} size="sm" />
                            </div>
                            <div className="text-[12px] text-[#565959]">
                              Quantity: {item.qty}
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex sm:flex-col gap-2 shrink-0">
                          <Link to={`/products/${product._id || item.productId}`}>
                            <Button variant="primary" size="compact" fullWidth>
                              Buy it again
                            </Button>
                          </Link>
                          <Link to={`/products/${product._id || item.productId}#reviews`}>
                            <Button variant="secondary" size="compact" fullWidth>
                              Write a review
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Cancellation Modal */}
        <Modal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          title="Cancel this order"
        >
          <form onSubmit={handleCancelSubmit} className="space-y-4">
            {actionError && (
              <div className="p-3 bg-[#FFF0F0] border-l-4 border-l-[#B12704] text-[13px] text-[#B12704] rounded-[2px]">
                {actionError}
              </div>
            )}
            <p className="text-[13px] text-[#565959]">
              Are you sure you want to cancel this order? Once cancelled, items cannot be reinstated.
            </p>
            <div>
              <label className="block text-[13px] font-medium text-[#0F1111] mb-1">
                Reason for cancellation:
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full h-[34px] px-2 text-[13px] border border-[#A6A6A6] rounded-[3px] focus:outline-none focus:border-[#E77600]"
              >
                <option value="Order Created by Mistake">Order Created by Mistake</option>
                <option value="Item Price Too High">Item Price Too High</option>
                <option value="Need to Change Shipping Address">Need to Change Shipping Address</option>
                <option value="Found Cheaper Somewhere Else">Found Cheaper Somewhere Else</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                size="compact"
                type="button"
                onClick={() => setShowCancelModal(false)}
              >
                Keep Order
              </Button>
              <Button
                variant="danger"
                size="compact"
                type="submit"
                disabled={isCancelling}
              >
                {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}
