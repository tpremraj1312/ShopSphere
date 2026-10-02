import React from 'react';
import { Link } from 'react-router-dom';
import { useGetSellerAnalyticsQuery } from '../../store/sellerApi';
import { useGetSellerOrdersQuery } from '../../store/orderApi';
import { useGetSellerProductsQuery } from '../../store/productsApi';
import { useGetInventoryQuery } from '../../store/sellerApi';
import Price from '../../components/ui/Price';
import Badge from '../../components/ui/Badge';
import {
  IndianRupee,
  ShoppingCart,
  Package,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  Clock,
  Truck,
  Plus,
  BarChart3,
  Eye,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

const TOOLTIP_STYLE = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #D5D9D9',
  borderRadius: '3px',
  fontSize: '12px',
  color: '#0F1111',
  boxShadow: '0 2px 5px rgba(15,17,17,0.15)',
};

const compact = (val) => (val >= 1000 ? `${+(val / 1000).toFixed(1)}k` : val);

function StatCard({ icon: Icon, iconBg, label, value, change, changeType = 'positive', loading }) {
  return (
    <div className="bg-white border border-[#D5D9D9] rounded-[8px] p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-[8px] flex items-center justify-center ${iconBg}`}>
          <Icon size={20} strokeWidth={1.75} className="text-white" />
        </div>
        {change && (
          <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full ${
            changeType === 'positive'
              ? 'text-[#007600] bg-[#E7F4E4]'
              : changeType === 'negative'
              ? 'text-[#B12704] bg-[#FFF0F0]'
              : 'text-[#565959] bg-[#F0F2F2]'
          }`}>
            {change}
          </span>
        )}
      </div>
      {loading ? (
        <div className="mt-3 h-8 w-24 rounded skeleton" />
      ) : (
        <div className="mt-3 text-[28px] leading-8 font-bold text-[#0F1111]">{value}</div>
      )}
      <div className="mt-1 text-[12px] text-[#565959]">{label}</div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, to, color }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 p-3 bg-white border border-[#D5D9D9] rounded-[8px] hover:border-[#007185] hover:shadow-sm transition-all group"
    >
      <div className={`w-9 h-9 rounded-[6px] flex items-center justify-center ${color}`}>
        <Icon size={18} strokeWidth={1.75} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium text-[#0F1111] group-hover:text-[#007185]">{label}</div>
      </div>
      <ArrowUpRight size={14} className="text-[#D5D9D9] group-hover:text-[#007185] transition-colors" />
    </Link>
  );
}

const STATUS_MAP = {
  pending: { label: 'Pending', variant: 'neutral' },
  confirmed: { label: 'Confirmed', variant: 'inStock' },
  processing: { label: 'Processing', variant: 'neutral' },
  shipped: { label: 'Shipped', variant: 'inStock' },
  delivered: { label: 'Delivered', variant: 'inStock' },
  cancelled: { label: 'Cancelled', variant: 'outOfStock' },
};

export default function SellerDashboard() {
  const { data: analyticsData, isLoading: analyticsLoading } = useGetSellerAnalyticsQuery({ timeframe: '30d' });
  const { data: ordersData, isLoading: ordersLoading } = useGetSellerOrdersQuery({ limit: 5, sort: '-createdAt' });
  const { data: productsData } = useGetSellerProductsQuery();
  const { data: inventoryData } = useGetInventoryQuery();

  const analytics = analyticsData?.data;
  const kpis = analytics?.kpis || analytics?.summary || {};
  const timeSeries = analytics?.timeSeries || analytics?.revenueOverTime || [];

  const recentOrders = ordersData?.data?.slice?.(0, 5) || ordersData?.orders?.slice?.(0, 5) || [];
  const products = productsData?.data || [];
  const inventory = inventoryData?.data || [];

  const lowStockCount = inventory.filter?.((item) => {
    const stock = item.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || item.stock || 0;
    return stock > 0 && stock < 10;
  })?.length || products.filter?.((p) => {
    const stock = p.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
    return stock > 0 && stock < 10;
  })?.length || 0;

  const pendingOrders = recentOrders.filter?.((o) => 
    o.status === 'pending' || o.status === 'confirmed'
  )?.length || 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-[24px] sm:text-[28px] leading-9 font-normal text-[#0F1111]">
          Dashboard
        </h1>
        <p className="text-[13px] text-[#565959] mt-1">
          Welcome back! Here's what's happening with your store today.
        </p>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={IndianRupee}
          iconBg="bg-[#007185]"
          label="Total Revenue (30d)"
          loading={analyticsLoading}
          value={`₹${(Number(kpis.totalRevenue) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          change={kpis.totalRevenue > 0 ? '+ Verified sales' : 'Realtime'}
          changeType={kpis.totalRevenue > 0 ? 'positive' : 'neutral'}
        />
        <StatCard
          icon={ShoppingCart}
          iconBg="bg-[#FFA41C]"
          label="Total Orders (30d)"
          loading={analyticsLoading}
          value={(kpis.totalOrders || 0).toLocaleString('en-IN')}
          change={kpis.totalOrders > 0 ? `${kpis.totalUnitsSold || kpis.totalOrders} units` : '0 orders'}
          changeType={kpis.totalOrders > 0 ? 'positive' : 'neutral'}
        />
        <StatCard
          icon={Clock}
          iconBg="bg-[#C45500]"
          label="Pending Orders"
          loading={ordersLoading}
          value={pendingOrders}
          change={pendingOrders > 0 ? 'Action needed' : 'All clear'}
          changeType={pendingOrders > 0 ? 'negative' : 'positive'}
        />
        <StatCard
          icon={AlertTriangle}
          iconBg={lowStockCount > 0 ? 'bg-[#B12704]' : 'bg-[#007600]'}
          label="Low Stock Items"
          value={lowStockCount}
          change={lowStockCount > 0 ? 'Restock soon' : 'Healthy'}
          changeType={lowStockCount > 0 ? 'negative' : 'positive'}
        />

      </div>

      {/* Charts + Quick Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <section className="xl:col-span-2 bg-white border border-[#D5D9D9] rounded-[8px] p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[16px] font-bold text-[#0F1111]">Revenue Overview</h2>
              <p className="text-[12px] text-[#565959]">Last 30 days</p>
            </div>
            <Link
              to="/seller/analytics"
              className="text-[12px] text-[#007185] hover:text-[#C7511F] hover:underline flex items-center gap-1"
            >
              View full analytics <ArrowUpRight size={12} />
            </Link>
          </div>
          {timeSeries.length === 0 ? (
            <div className="h-56 sm:h-64 w-full flex flex-col items-center justify-center text-center p-4 bg-[#F7F8F8] rounded border border-dashed border-[#D5D9D9]">
              <BarChart3 size={32} className="text-[#888C8C] mb-2" />
              <p className="text-[13px] font-bold text-[#0F1111]">No sales data recorded yet</p>
              <p className="text-[12px] text-[#565959] mt-0.5">
                Revenue trends will populate in real time as customers purchase your listings.
              </p>
            </div>
          ) : (
            <div className="h-56 sm:h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeries} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashRevGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#007185" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#007185" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EAEDED" vertical={false} />
                  <XAxis dataKey="date" stroke="#767676" fontSize={11} tickLine={false} axisLine={{ stroke: '#D5D9D9' }} />
                  <YAxis
                    stroke="#767676"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    width={48}
                    tickFormatter={(val) => `₹${compact(val)}`}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#007185"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#dashRevGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>


        {/* Quick Actions */}
        <section className="space-y-3">
          <h2 className="text-[16px] font-bold text-[#0F1111]">Quick Actions</h2>
          <QuickAction
            icon={Plus}
            label="Add a new product"
            to="/seller/products"
            color="bg-[#007185]"
          />
          <QuickAction
            icon={Package}
            label="Check inventory levels"
            to="/seller/inventory"
            color="bg-[#FFA41C]"
          />
          <QuickAction
            icon={ShoppingCart}
            label="View pending orders"
            to="/seller/orders"
            color="bg-[#C45500]"
          />
          <QuickAction
            icon={Truck}
            label="Manage shipments"
            to="/seller/shipping"
            color="bg-[#232F3E]"
          />
          <QuickAction
            icon={BarChart3}
            label="Sales analytics"
            to="/seller/analytics"
            color="bg-[#007600]"
          />
        </section>
      </div>

      {/* Recent Orders */}
      <section className="bg-white border border-[#D5D9D9] rounded-[8px] overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-[#D5D9D9]">
          <h2 className="text-[16px] font-bold text-[#0F1111]">Recent Orders</h2>
          <Link
            to="/seller/orders"
            className="text-[12px] text-[#007185] hover:text-[#C7511F] hover:underline flex items-center gap-1"
          >
            View all <ArrowUpRight size={12} />
          </Link>
        </div>

        {ordersLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 rounded skeleton" />
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <ShoppingCart size={32} strokeWidth={1.25} className="mx-auto text-[#8D9096]" />
            <p className="mt-2 text-[14px] font-medium text-[#0F1111]">No orders yet</p>
            <p className="mt-1 text-[12px] text-[#565959]">Orders will appear here once customers start buying.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#F0F2F2] border-b border-[#D5D9D9]">
                <tr>
                  <th className="px-4 sm:px-5 py-2.5 font-bold text-[#0F1111]">Order ID</th>
                  <th className="px-4 py-2.5 font-bold text-[#0F1111] hidden sm:table-cell">Date</th>
                  <th className="px-4 py-2.5 font-bold text-[#0F1111]">Items</th>
                  <th className="px-4 py-2.5 font-bold text-[#0F1111]">Total</th>
                  <th className="px-4 sm:px-5 py-2.5 font-bold text-[#0F1111]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E7E7]">
                {recentOrders.map((order) => {
                  const statusInfo = STATUS_MAP[order.status] || { label: order.status, variant: 'neutral' };
                  const itemCount = order.items?.length || order.subOrders?.reduce((s, so) => s + (so.items?.length || 0), 0) || 0;
                  return (
                    <tr key={order._id} className="hover:bg-[#F7FAFA] transition-colors">
                      <td className="px-4 sm:px-5 py-3">
                        <Link
                          to={`/seller/orders`}
                          className="text-[#007185] hover:text-[#C7511F] hover:underline font-mono text-[12px]"
                        >
                          #{order._id?.slice(-8)?.toUpperCase()}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-[#565959] hidden sm:table-cell">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        }) : '—'}
                      </td>
                      <td className="px-4 py-3 text-[#565959]">
                        {itemCount} {itemCount === 1 ? 'item' : 'items'}
                      </td>
                      <td className="px-4 py-3">
                        <Price amount={order.totalAmount || order.total || 0} size="sm" />
                      </td>
                      <td className="px-4 sm:px-5 py-3">
                        <Badge variant={statusInfo.variant} size="sm">
                          {statusInfo.label}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Alerts */}
      {lowStockCount > 0 && (
        <section className="bg-[#FFF8E1] border border-[#FFA41C] rounded-[8px] p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-[#C45500] shrink-0 mt-0.5" />
          <div>
            <div className="text-[14px] font-bold text-[#0F1111]">Low Stock Alert</div>
            <p className="text-[13px] text-[#565959] mt-0.5">
              {lowStockCount} {lowStockCount === 1 ? 'product is' : 'products are'} running low on inventory.
              Consider restocking to avoid missed sales.
            </p>
            <Link
              to="/seller/inventory"
              className="inline-flex items-center gap-1 mt-2 text-[13px] text-[#007185] hover:text-[#C7511F] hover:underline font-medium"
            >
              <Eye size={14} /> Review inventory
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
