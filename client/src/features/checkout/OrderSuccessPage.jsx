import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGetOrderByIdQuery } from '../../store/orderApi';
import Price from '../../components/ui/Price';
import Button from '../../components/ui/Button';
import { CheckCircle2, Package, Truck, ArrowRight } from 'lucide-react';

export default function OrderSuccessPage() {
  const { orderId } = useParams();
  const { data: orderData, isLoading } = useGetOrderByIdQuery(orderId);
  const order = orderData?.data;

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#007600] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h2 className="text-[20px] font-semibold text-[#0F1111] mb-2">Order Not Found</h2>
        <Link to="/orders" className="text-[#007185] hover:underline">
          Go to Your Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#EAEDED] min-h-screen py-10">
      <div className="max-w-4xl mx-auto px-4">
        {/* Success Card */}
        <div className="bg-white border border-[#D5D9D9] rounded-[4px] p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4 pb-6 border-b border-[#D5D9D9]">
            <CheckCircle2 size={36} strokeWidth={2} className="text-[#007600] shrink-0 mt-0.5" />
            <div>
              <h1 className="text-[22px] font-semibold text-[#0F1111]">
                Thank you, your order has been placed!
              </h1>
              <p className="text-[13px] text-[#565959] mt-1">
                An email confirmation has been sent to your registered address.
              </p>
              <div className="text-[13px] text-[#0F1111] mt-2">
                Order <strong className="font-mono text-[#007185]">#{order._id}</strong>
              </div>
            </div>
          </div>

          {/* Delivery Note */}
          <div className="p-4 bg-[#F7FAFA] border border-[#D5D9D9] rounded-[3px] flex items-center gap-3 text-[13px]">
            <Truck size={20} strokeWidth={1.75} className="text-[#007600] shrink-0" />
            <div>
              <span className="font-semibold text-[#0F1111]">Guaranteed Delivery: Tomorrow</span>
              <span className="text-[#565959] ml-1.5">
                Items grouped into {order.subOrders?.length || 1} independent shipment(s).
              </span>
            </div>
          </div>

          {/* Sub-Orders List */}
          <div className="space-y-4">
            <h2 className="text-[16px] font-semibold text-[#0F1111]">Shipment Details</h2>
            {order.subOrders?.map((subOrder, idx) => (
              <div
                key={subOrder._id || idx}
                className="border border-[#D5D9D9] rounded-[3px] p-4 bg-white space-y-3"
              >
                <div className="flex items-center justify-between text-[12px] pb-2 border-b border-[#D5D9D9]">
                  <span className="font-semibold text-[#565959]">
                    Package {idx + 1} of {order.subOrders.length}
                  </span>
                  <span className="px-2 py-0.5 bg-[#F0F8F0] text-[#007600] font-semibold rounded-[2px] uppercase">
                    {subOrder.status || 'Processing'}
                  </span>
                </div>

                <div className="divide-y divide-[#D5D9D9]">
                  {subOrder.items.map((item) => (
                    <div key={item.sku} className="py-2 flex items-center justify-between text-[13px]">
                      <div>
                        <div className="font-medium text-[#0F1111]">{item.title}</div>
                        <div className="text-[11px] text-[#565959]">Qty: {item.qty}</div>
                      </div>
                      <Price amount={item.unitPrice * item.qty} size="sm" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Shipping Address & Actions */}
          <div className="pt-4 border-t border-[#D5D9D9] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="text-[12px] text-[#565959] leading-relaxed">
              <strong className="text-[#0F1111] block mb-0.5">Shipping to:</strong>
              <div>{order.shippingAddress?.fullName || 'Customer'}</div>
              <div>{order.shippingAddress?.addressLine1}</div>
              <div>
                {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}
              </div>
            </div>

            <div className="flex gap-3">
              <Link to="/orders">
                <Button variant="secondary" size="form">
                  View your orders
                </Button>
              </Link>
              <Link to="/">
                <Button variant="primary" size="form">
                  Continue shopping
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
