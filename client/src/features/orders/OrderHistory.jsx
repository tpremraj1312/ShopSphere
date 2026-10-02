import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetMyOrdersQuery } from '../../store/orderApi';
import Tabs from '../../components/ui/Tabs';
import Price from '../../components/ui/Price';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import { Search, PackageCheck } from 'lucide-react';

export default function OrderHistory() {
  const [activeTab, setActiveTab] = useState('orders');
  const [timeFilter, setTimeFilter] = useState('3months');
  const [searchQuery, setSearchQuery] = useState('');

  const statusParam = activeTab === 'notShipped' ? 'confirmed' : activeTab === 'cancelled' ? 'cancelled' : undefined;

  const { data, isLoading, error } = useGetMyOrdersQuery({
    limit: 20,
    status: statusParam,
  });

  const orders = data?.data || [];

  const tabs = [
    { id: 'orders', label: 'Orders' },
    { id: 'notShipped', label: 'Not Yet Shipped' },
    { id: 'cancelled', label: 'Cancelled Orders' },
  ];

  return (
    <div className="bg-[#EAEDED] min-h-[calc(100vh-280px)] py-6">
      <div className="max-w-[1200px] mx-auto px-4 space-y-4">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Your Account', href: '#' },
            { label: 'Your Orders' },
          ]}
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-[24px] font-normal text-[#0F1111]">Your Orders</h1>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Search all orders"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-[32px] pl-3 pr-8 text-[13px] border border-[#A6A6A6] rounded-[3px] focus:outline-none focus:border-[#E77600]"
            />
            <Search size={15} strokeWidth={2} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#565959]" />
          </div>
        </div>

        {/* Tab Strip */}
        <div className="bg-white border-b border-[#D5D9D9]">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>

        {/* Orders Placed In Filter */}
        <div className="flex items-center gap-2 text-[13px] text-[#565959]">
          <span>{orders.length} orders placed in</span>
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="h-[28px] px-2 text-[12px] bg-[#F0F2F2] border border-[#D5D9D9] rounded-[3px] text-[#0F1111] cursor-pointer"
          >
            <option value="3months">past 3 months</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>
        </div>

        {/* Loading / Error / Empty States */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-44 bg-white border border-[#D5D9D9] rounded-[4px] skeleton" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white border border-[#D5D9D9] rounded-[4px] p-10 text-center space-y-3">
            <p className="text-[14px] text-[#565959]">
              We couldn't find any orders placed in the selected time period.
            </p>
            <Link to="/products">
              <Button variant="primary" size="compact">
                Start shopping
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const dateStr = new Date(order.createdAt || Date.now()).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              const subOrders = order.subOrders || [];
              const allItems = subOrders.flatMap((sub) => sub.items || []);
              const firstItem = allItems[0] || {};
              const firstProduct = firstItem.productId || {};
              const title = firstItem.title || firstProduct.title || firstProduct.name || 'ShopSphere Item';
              const imageSrc =
                firstItem.image ||
                firstProduct.images?.[0]?.url ||
                firstProduct.images?.[0] ||
                firstProduct.image ||
                'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80';

              const status = subOrders[0]?.status || 'confirmed';

              return (
                <div
                  key={order._id}
                  className="bg-white border border-[#D5D9D9] rounded-[4px] overflow-hidden"
                >
                  {/* Amazon Classic Grey Header Band */}
                  <div className="bg-[#F0F2F2] border-b border-[#D5D9D9] px-4 py-3 flex flex-wrap items-center justify-between gap-4 text-[12px] text-[#565959]">
                    <div className="flex flex-wrap items-center gap-6">
                      <div>
                        <div className="uppercase font-medium text-[11px] text-[#767676]">Order Placed</div>
                        <div className="text-[#0F1111] font-normal">{dateStr}</div>
                      </div>
                      <div>
                        <div className="uppercase font-medium text-[11px] text-[#767676]">Total</div>
                        <div className="text-[#0F1111] font-normal">
                          <Price amount={order.pricing?.total ?? order.pricing?.totalAmount ?? order.total ?? 0} size="sm" />
                        </div>
                      </div>
                      <div>
                        <div className="uppercase font-medium text-[11px] text-[#767676]">Ship To</div>
                        <div className="text-[#007185] hover:text-[#C7511F] hover:underline cursor-pointer">
                          {order.shippingAddress?.fullName || 'Customer'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div>
                        <div className="uppercase font-medium text-[11px] text-[#767676] text-right">Order # {order._id}</div>
                        <div className="flex gap-2 justify-end">
                          <Link to={`/orders/${order._id}`} className="text-[#007185] hover:text-[#C7511F] hover:underline">
                            View order details
                          </Link>
                          <span>·</span>
                          <span className="text-[#007185] hover:text-[#C7511F] hover:underline cursor-pointer">Invoice</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 flex flex-col md:flex-row items-start justify-between gap-6">
                    {/* Item Information */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[16px] font-semibold text-[#0F1111]">
                          {status === 'delivered' ? 'Delivered' : status === 'shipped' ? 'Shipped' : 'Preparing for shipment'}
                        </span>
                        <Badge variant={status === 'delivered' ? 'inStock' : 'neutral'} size="sm">
                          {status}
                        </Badge>
                      </div>

                      <div className="flex gap-4 items-start">
                        <img
                          src={imageSrc}
                          alt={title}
                          className="w-20 h-20 object-contain bg-[#F0F2F2] border border-[#D5D9D9] rounded-[2px] p-1 shrink-0"
                        />
                        <div className="space-y-1">
                          <Link
                            to={`/products/${firstProduct._id || firstItem.productId}`}
                            className="text-[14px] font-medium text-[#007185] hover:text-[#C7511F] hover:underline line-clamp-2"
                          >
                            {title}
                          </Link>
                          <div className="text-[12px] text-[#565959]">
                            Quantity: {firstItem.qty || 1}
                          </div>
                          <div className="pt-1">
                            <Link to={`/products/${firstProduct._id || firstItem.productId}`}>
                              <Button variant="primary" size="compact">
                                Buy it again
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions Column */}
                    <div className="w-full md:w-52 space-y-2 shrink-0">
                      <Link to={`/orders/${order._id}`} className="block">
                        <Button variant="primary" size="compact" fullWidth>
                          Track package
                        </Button>
                      </Link>
                      <Link to={`/orders/${order._id}`} className="block">
                        <Button variant="secondary" size="compact" fullWidth>
                          View or edit order
                        </Button>
                      </Link>
                      <Link to={`/products/${firstProduct._id || firstItem.productId}#reviews`} className="block">
                        <Button variant="secondary" size="compact" fullWidth>
                          Write a product review
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
