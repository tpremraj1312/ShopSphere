import React, { useState, useMemo } from 'react';
import { useGetSellerOrdersQuery, useUpdateSubOrderStatusMutation } from '../../store/orderApi';
import Price from '../../components/ui/Price';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  RefreshCw,
  AlertCircle,
  MapPin,
  User,
  Calendar,
  CreditCard,
} from 'lucide-react';

const STATUS_TABS = [
  { key: 'all', label: 'All Orders' },
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

const STATUS_CONFIG = {
  pending: { label: 'Pending', variant: 'neutral', icon: Clock, color: 'text-[#C45500]' },
  confirmed: { label: 'Confirmed', variant: 'inStock', icon: CheckCircle, color: 'text-[#007600]' },
  processing: { label: 'Processing', variant: 'neutral', icon: RefreshCw, color: 'text-[#007185]' },
  shipped: { label: 'Shipped', variant: 'inStock', icon: Truck, color: 'text-[#007185]' },
  delivered: { label: 'Delivered', variant: 'inStock', icon: CheckCircle, color: 'text-[#007600]' },
  cancelled: { label: 'Cancelled', variant: 'outOfStock', icon: XCircle, color: 'text-[#B12704]' },
};

const NEXT_STATUS = {
  pending: 'confirmed',
  confirmed: 'processing',
  processing: 'shipped',
  shipped: 'delivered',
};

const FIELD =
  'w-full h-[34px] px-2.5 text-[13px] text-[#0F1111] bg-white border border-[#888C8C] rounded-[3px] ' +
  'shadow-[inset_0_1px_2px_rgba(15,17,17,0.15)] focus:outline-none focus:border-[#E77600] ' +
  'focus:shadow-[0_0_3px_2px_rgba(228,121,17,0.5)]';

function OrderDetailPanel({ order, onClose, onUpdateStatus }) {
  if (!order) return null;

  const statusInfo = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusInfo.icon;
  const items = order.items || order.subOrders?.flatMap((so) => so.items || []) || [];
  const nextStatus = NEXT_STATUS[order.status];

  return (
    <Modal isOpen={!!order} onClose={onClose} title="Order Details" maxWidth="max-w-2xl">
      <div className="space-y-5">
        {/* Order Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#D5D9D9]">
          <div>
            <div className="text-[12px] text-[#565959]">Order ID</div>
            <div className="text-[16px] font-bold text-[#0F1111] font-mono">
              #{order._id?.slice(-8)?.toUpperCase()}
            </div>
            <div className="text-[12px] text-[#565959] mt-1">
              {order.createdAt && new Date(order.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
              })}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusIcon size={16} className={statusInfo.color} />
            <Badge variant={statusInfo.variant} size="sm">{statusInfo.label}</Badge>
          </div>
        </div>

        {/* Customer Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-2">
            <User size={16} className="text-[#565959] mt-0.5 shrink-0" />
            <div>
              <div className="text-[12px] text-[#565959]">Customer</div>
              <div className="text-[13px] font-medium text-[#0F1111]">
                {order.userId?.name || order.customer?.name || 'Customer'}
              </div>
              <div className="text-[12px] text-[#565959]">
                {order.userId?.email || order.customer?.email || ''}
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin size={16} className="text-[#565959] mt-0.5 shrink-0" />
            <div>
              <div className="text-[12px] text-[#565959]">Shipping Address</div>
              <div className="text-[13px] text-[#0F1111]">
                {order.shippingAddress
                  ? `${order.shippingAddress.street || ''}, ${order.shippingAddress.city || ''} ${order.shippingAddress.state || ''} ${order.shippingAddress.pincode || ''}`
                  : 'Not provided'}
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CreditCard size={16} className="text-[#565959] mt-0.5 shrink-0" />
            <div>
              <div className="text-[12px] text-[#565959]">Payment</div>
              <div className="text-[13px] font-medium text-[#0F1111] capitalize">
                {order.paymentMethod || order.payment?.method || 'Online'}
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Calendar size={16} className="text-[#565959] mt-0.5 shrink-0" />
            <div>
              <div className="text-[12px] text-[#565959]">Expected Delivery</div>
              <div className="text-[13px] text-[#0F1111]">
                {order.estimatedDelivery
                  ? new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                  : '3-5 business days'}
              </div>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="border border-[#D5D9D9] rounded-[4px] overflow-hidden">
          <div className="px-4 py-2.5 bg-[#F0F2F2] border-b border-[#D5D9D9] text-[13px] font-bold text-[#0F1111]">
            Items ({items.length})
          </div>
          <div className="divide-y divide-[#E7E7E7]">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3">
                <div className="w-14 h-14 bg-white border border-[#D5D9D9] rounded-[2px] flex items-center justify-center overflow-hidden shrink-0">
                  {item.image || item.product?.image ? (
                    <img src={item.image || item.product?.image} alt="" className="w-full h-full object-contain p-0.5" />
                  ) : (
                    <Package size={20} className="text-[#8D9096]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-[#0F1111] font-medium line-clamp-1">
                    {item.title || item.product?.title || 'Product'}
                  </div>
                  <div className="text-[12px] text-[#565959] mt-0.5">
                    Qty: {item.quantity || 1} · SKU: {item.sku || 'N/A'}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <Price amount={item.price || 0} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Total */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#F0F2F2] rounded-[4px]">
          <span className="text-[14px] font-bold text-[#0F1111]">Order Total</span>
          <Price amount={order.totalAmount || order.total || 0} size="md" />
        </div>

        {/* Actions */}
        {nextStatus && order.status !== 'cancelled' && order.status !== 'delivered' && (
          <div className="flex justify-end gap-2 pt-2 border-t border-[#D5D9D9]">
            <Button variant="secondary" size="compact" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="primary"
              size="compact"
              onClick={() => onUpdateStatus(order, nextStatus)}
            >
              {nextStatus === 'confirmed' && 'Confirm Order'}
              {nextStatus === 'processing' && 'Start Processing'}
              {nextStatus === 'shipped' && 'Mark as Shipped'}
              {nextStatus === 'delivered' && 'Mark as Delivered'}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default function SellerOrders() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [sortField, setSortField] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  const { data, isLoading, error, refetch } = useGetSellerOrdersQuery({
    sort: sortDir === 'desc' ? `-${sortField}` : sortField,
  });
  const [updateSubOrderStatus, { isLoading: isUpdating }] = useUpdateSubOrderStatusMutation();

  const allOrders = useMemo(() => {
    const raw = data?.data || data?.orders || [];
    return Array.isArray(raw) ? raw : [];
  }, [data]);

  const filteredOrders = useMemo(() => {
    let result = allOrders;

    if (activeTab !== 'all') {
      result = result.filter((o) => o.status === activeTab);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o._id?.toLowerCase().includes(q) ||
          o.userId?.name?.toLowerCase().includes(q) ||
          o.userId?.email?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [allOrders, activeTab, searchQuery]);

  const handleUpdateStatus = async (order, newStatus) => {
    try {
      if (order.subOrders?.length > 0) {
        for (const sub of order.subOrders) {
          await updateSubOrderStatus({
            orderId: order._id,
            subOrderId: sub._id,
            status: newStatus,
          }).unwrap();
        }
      }
      setSelectedOrder(null);
      refetch();
    } catch (err) {
      alert(err.data?.error?.message || 'Failed to update order status');
    }
  };

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDir === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-[24px] sm:text-[28px] leading-8 font-normal text-[#0F1111]">
            Manage Orders
          </h1>
          <p className="text-[13px] text-[#565959] mt-1">
            View, process, and manage customer orders.
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

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#565959]" />
          <input
            type="text"
            placeholder="Search by order ID or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`${FIELD} pl-9`}
          />
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin">
        {STATUS_TABS.map((tab) => {
          const count =
            tab.key === 'all'
              ? allOrders.length
              : allOrders.filter((o) => o.status === tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-2 rounded-[3px] text-[12px] font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? 'bg-[#232F3E] text-white'
                  : 'bg-[#F0F2F2] text-[#565959] hover:bg-[#E3E6E6] hover:text-[#0F1111]'
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-[#D5D9D9] text-[#565959]'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-white border border-[#CC0C39] rounded-[4px] text-[13px]">
          <AlertCircle size={18} className="text-[#CC0C39] shrink-0 mt-px" />
          <div>
            <div className="font-bold text-[#B12704]">Failed to load orders</div>
            <button type="button" onClick={refetch} className="text-[#007185] hover:underline">
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white border border-[#D5D9D9] rounded-[8px] overflow-hidden">
        <div className="px-4 py-2.5 border-b border-[#D5D9D9] bg-[#F7F8F8] text-[13px] text-[#565959]">
          {isLoading ? 'Loading…' : `${filteredOrders.length} ${filteredOrders.length === 1 ? 'order' : 'orders'}`}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead className="bg-[#F0F2F2] border-b border-[#D5D9D9]">
              <tr className="text-[#0F1111]">
                <th className="px-4 py-2.5 font-bold">Order ID</th>
                <th className="px-4 py-2.5 font-bold hidden md:table-cell">
                  <button onClick={() => toggleSort('createdAt')} className="flex items-center gap-1 hover:text-[#007185]">
                    Date <SortIcon field="createdAt" />
                  </button>
                </th>
                <th className="px-4 py-2.5 font-bold hidden lg:table-cell">Customer</th>
                <th className="px-4 py-2.5 font-bold">Items</th>
                <th className="px-4 py-2.5 font-bold">
                  <button onClick={() => toggleSort('totalAmount')} className="flex items-center gap-1 hover:text-[#007185]">
                    Total <SortIcon field="totalAmount" />
                  </button>
                </th>
                <th className="px-4 py-2.5 font-bold">Status</th>
                <th className="px-4 py-2.5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E7E7]">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-4 py-3">
                      <div className="h-10 rounded-[2px] skeleton" />
                    </td>
                  </tr>
                ))
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center">
                    <Package size={36} strokeWidth={1.25} className="mx-auto text-[#8D9096]" />
                    <p className="mt-3 text-[16px] font-bold text-[#0F1111]">
                      {searchQuery || activeTab !== 'all' ? 'No matching orders' : 'No orders yet'}
                    </p>
                    <p className="mt-1 text-[13px] text-[#565959]">
                      {searchQuery || activeTab !== 'all'
                        ? 'Try adjusting your filters or search query.'
                        : 'Orders will appear here once customers place them.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const statusInfo = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                  const itemCount = order.items?.length || order.subOrders?.reduce((s, so) => s + (so.items?.length || 0), 0) || 0;
                  const nextStatus = NEXT_STATUS[order.status];

                  return (
                    <tr key={order._id} className="hover:bg-[#F7FAFA] transition-colors align-middle">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-[#007185] hover:text-[#C7511F] hover:underline font-mono text-[12px] font-medium"
                        >
                          #{order._id?.slice(-8)?.toUpperCase()}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-[#565959] hidden md:table-cell">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric', month: 'short', year: 'numeric'
                            })
                          : '—'}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="text-[13px] text-[#0F1111]">
                          {order.userId?.name || order.customer?.name || 'Customer'}
                        </div>
                        <div className="text-[11px] text-[#565959]">
                          {order.userId?.email || order.customer?.email || ''}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#565959]">
                        {itemCount} {itemCount === 1 ? 'item' : 'items'}
                      </td>
                      <td className="px-4 py-3">
                        <Price amount={order.totalAmount || order.total || 0} size="sm" />
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusInfo.variant} size="sm">{statusInfo.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="inline-flex items-center justify-center w-8 h-8 text-[#007185] hover:text-[#C7511F] hover:bg-[#F0F2F2] rounded-[3px]"
                          title="View details"
                        >
                          <Eye size={16} strokeWidth={1.75} />
                        </button>
                        {nextStatus && order.status !== 'cancelled' && (
                          <button
                            onClick={() => handleUpdateStatus(order, nextStatus)}
                            disabled={isUpdating}
                            className="inline-flex items-center justify-center px-2.5 h-8 text-[12px] font-medium text-white bg-[#007185] hover:bg-[#005F6B] rounded-[3px] ml-1.5 disabled:opacity-50"
                            title={`Move to ${nextStatus}`}
                          >
                            {nextStatus === 'confirmed' && 'Confirm'}
                            {nextStatus === 'processing' && 'Process'}
                            {nextStatus === 'shipped' && 'Ship'}
                            {nextStatus === 'delivered' && 'Deliver'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      <OrderDetailPanel
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
}