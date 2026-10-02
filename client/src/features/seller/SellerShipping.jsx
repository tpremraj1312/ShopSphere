import React, { useState, useMemo } from 'react';
import { useGetSellerOrdersQuery, useUpdateSubOrderStatusMutation } from '../../store/orderApi';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import {
  Truck,
  Package,
  CheckCircle,
  Clock,
  MapPin,
  Search,
  RefreshCw,
  AlertCircle,
  Copy,
  ExternalLink,
} from 'lucide-react';

const SHIPPING_TABS = [
  { key: 'pending', label: 'Awaiting Shipment' },
  { key: 'shipped', label: 'In Transit' },
  { key: 'delivered', label: 'Delivered' },
];

const TIMELINE_STEPS = {
  pending: [
    { label: 'Order Placed', done: true },
    { label: 'Confirmed', done: true },
    { label: 'Shipped', done: false },
    { label: 'Delivered', done: false },
  ],
  confirmed: [
    { label: 'Order Placed', done: true },
    { label: 'Confirmed', done: true },
    { label: 'Shipped', done: false },
    { label: 'Delivered', done: false },
  ],
  processing: [
    { label: 'Order Placed', done: true },
    { label: 'Confirmed', done: true },
    { label: 'Processing', done: true },
    { label: 'Shipped', done: false },
    { label: 'Delivered', done: false },
  ],
  shipped: [
    { label: 'Order Placed', done: true },
    { label: 'Confirmed', done: true },
    { label: 'Shipped', done: true },
    { label: 'Delivered', done: false },
  ],
  delivered: [
    { label: 'Order Placed', done: true },
    { label: 'Confirmed', done: true },
    { label: 'Shipped', done: true },
    { label: 'Delivered', done: true },
  ],
};

function StatusTimeline({ status }) {
  const steps = TIMELINE_STEPS[status] || TIMELINE_STEPS.pending;
  return (
    <div className="flex items-center gap-0 w-full">
      {steps.map((step, idx) => (
        <React.Fragment key={idx}>
          <div className="flex flex-col items-center">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step.done
                  ? 'bg-[#007600] text-white'
                  : 'bg-[#F0F2F2] text-[#565959] border border-[#D5D9D9]'
              }`}
            >
              {step.done ? <CheckCircle size={14} /> : idx + 1}
            </div>
            <span className={`text-[9px] mt-1 text-center leading-tight max-w-[60px] ${
              step.done ? 'text-[#007600] font-medium' : 'text-[#565959]'
            }`}>
              {step.label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div className={`flex-1 h-[2px] mx-1 mt-[-14px] ${
              steps[idx + 1]?.done ? 'bg-[#007600]' : 'bg-[#D5D9D9]'
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function SellerShipping() {
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, error, refetch } = useGetSellerOrdersQuery({});
  const [updateSubOrderStatus, { isLoading: isUpdating }] = useUpdateSubOrderStatusMutation();

  const allOrders = useMemo(() => {
    const raw = data?.data || data?.orders || [];
    return Array.isArray(raw) ? raw : [];
  }, [data]);

  const filteredOrders = useMemo(() => {
    let result = allOrders;

    // Tab filter
    if (activeTab === 'pending') {
      result = result.filter((o) => ['pending', 'confirmed', 'processing'].includes(o.status));
    } else {
      result = result.filter((o) => o.status === activeTab);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o._id?.toLowerCase().includes(q) ||
          o.trackingNumber?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [allOrders, activeTab, searchQuery]);

  const handleShipOrder = async (order) => {
    try {
      if (order.subOrders?.length > 0) {
        for (const sub of order.subOrders) {
          await updateSubOrderStatus({
            orderId: order._id,
            subOrderId: sub._id,
            status: 'shipped',
          }).unwrap();
        }
      }
      refetch();
    } catch (err) {
      alert(err.data?.error?.message || 'Failed to update shipment status');
    }
  };

  const handleDeliverOrder = async (order) => {
    try {
      if (order.subOrders?.length > 0) {
        for (const sub of order.subOrders) {
          await updateSubOrderStatus({
            orderId: order._id,
            subOrderId: sub._id,
            status: 'delivered',
          }).unwrap();
        }
      }
      refetch();
    } catch (err) {
      alert(err.data?.error?.message || 'Failed to mark as delivered');
    }
  };

  const stats = useMemo(() => ({
    awaiting: allOrders.filter((o) => ['pending', 'confirmed', 'processing'].includes(o.status)).length,
    inTransit: allOrders.filter((o) => o.status === 'shipped').length,
    delivered: allOrders.filter((o) => o.status === 'delivered').length,
  }), [allOrders]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-[24px] sm:text-[28px] leading-8 font-normal text-[#0F1111]">
            Shipping & Fulfillment
          </h1>
          <p className="text-[13px] text-[#565959] mt-1">
            Track shipments and manage order fulfillment.
          </p>
        </div>
        <Button
          variant="secondary"
          size="form"
          onClick={refetch}
          className="inline-flex items-center justify-center gap-1.5"
        >
          <RefreshCw size={14} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-[#D5D9D9] rounded-[8px] p-4 text-center">
          <Clock size={24} className="mx-auto text-[#C45500]" />
          <div className="text-[24px] font-bold text-[#0F1111] mt-2">{stats.awaiting}</div>
          <div className="text-[12px] text-[#565959]">Awaiting Shipment</div>
        </div>
        <div className="bg-white border border-[#D5D9D9] rounded-[8px] p-4 text-center">
          <Truck size={24} className="mx-auto text-[#007185]" />
          <div className="text-[24px] font-bold text-[#0F1111] mt-2">{stats.inTransit}</div>
          <div className="text-[12px] text-[#565959]">In Transit</div>
        </div>
        <div className="bg-white border border-[#D5D9D9] rounded-[8px] p-4 text-center">
          <CheckCircle size={24} className="mx-auto text-[#007600]" />
          <div className="text-[24px] font-bold text-[#0F1111] mt-2">{stats.delivered}</div>
          <div className="text-[12px] text-[#565959]">Delivered</div>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-1">
          {SHIPPING_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-2 rounded-[3px] text-[12px] font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? 'bg-[#232F3E] text-white'
                  : 'bg-[#F0F2F2] text-[#565959] hover:bg-[#E3E6E6]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#565959]" />
          <input
            type="text"
            placeholder="Search by order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-[34px] pl-9 pr-3 text-[13px] bg-white border border-[#888C8C] rounded-[3px] focus:outline-none focus:border-[#E77600]"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-white border border-[#CC0C39] rounded-[4px] text-[13px]">
          <AlertCircle size={18} className="text-[#CC0C39] shrink-0 mt-px" />
          <div>
            <div className="font-bold text-[#B12704]">Failed to load shipments</div>
            <button onClick={refetch} className="text-[#007185] hover:underline">Try again</button>
          </div>
        </div>
      )}

      {/* Shipment Cards */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 rounded-[8px] skeleton" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white border border-[#D5D9D9] rounded-[8px] p-10 text-center">
          <Truck size={40} strokeWidth={1.25} className="mx-auto text-[#8D9096]" />
          <p className="mt-3 text-[16px] font-bold text-[#0F1111]">No shipments found</p>
          <p className="mt-1 text-[13px] text-[#565959]">
            {activeTab === 'pending'
              ? 'No orders awaiting shipment.'
              : activeTab === 'shipped'
              ? 'No shipments currently in transit.'
              : 'No deliveries completed yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const itemCount = order.items?.length || order.subOrders?.reduce((s, so) => s + (so.items?.length || 0), 0) || 0;
            return (
              <div key={order._id} className="bg-white border border-[#D5D9D9] rounded-[8px] overflow-hidden hover:shadow-sm transition-shadow">
                {/* Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 bg-[#F7F8F8] border-b border-[#D5D9D9] gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[12px] font-mono text-[#007185] font-medium">
                      #{order._id?.slice(-8)?.toUpperCase()}
                    </span>
                    <span className="text-[12px] text-[#565959]">
                      {order.createdAt && new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short'
                      })}
                    </span>
                    <span className="text-[12px] text-[#565959]">{itemCount} items</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {order.shippingAddress && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#565959]">
                        <MapPin size={12} />
                        {order.shippingAddress.city || order.shippingAddress.state || 'Address'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Timeline */}
                <div className="px-6 py-4">
                  <StatusTimeline status={order.status} />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-[#E7E7E7]">
                  <div className="text-[13px] text-[#0F1111]">
                    <span className="font-bold">₹{(order.totalAmount || order.total || 0).toLocaleString('en-IN')}</span>
                    <span className="text-[#565959] ml-2 capitalize">
                      {order.paymentMethod || 'online'} payment
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {['pending', 'confirmed', 'processing'].includes(order.status) && (
                      <Button
                        variant="primary"
                        size="compact"
                        onClick={() => handleShipOrder(order)}
                        disabled={isUpdating}
                        className="inline-flex items-center gap-1 text-[12px]"
                      >
                        <Truck size={14} /> Mark as Shipped
                      </Button>
                    )}
                    {order.status === 'shipped' && (
                      <Button
                        variant="primary"
                        size="compact"
                        onClick={() => handleDeliverOrder(order)}
                        disabled={isUpdating}
                        className="inline-flex items-center gap-1 text-[12px]"
                      >
                        <CheckCircle size={14} /> Mark Delivered
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
