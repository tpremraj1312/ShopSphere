import React, { useState } from 'react';
import { useGetSellerAnalyticsQuery } from '../../store/sellerApi';
import Price from '../../components/ui/Price';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { IndianRupee, ShoppingBag, RotateCcw, TrendingUp } from 'lucide-react';

const TIMEFRAME_OPTIONS = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
];

const TOOLTIP_STYLE = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #D5D9D9',
  borderRadius: '3px',
  fontSize: '12px',
  color: '#0F1111',
  boxShadow: '0 2px 5px rgba(15,17,17,0.15)',
};

const compact = (val) => (val >= 1000 ? `${+(val / 1000).toFixed(1)}k` : val);

function KpiCard({ label, value, note, noteClass = 'text-[#565959]', icon: Icon, iconClass = 'text-[#565959]', loading }) {
  return (
    <div className="bg-white border border-[#D5D9D9] rounded-[4px] p-4">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-bold text-[#0F1111]">{label}</span>
        <Icon size={18} strokeWidth={1.75} className={iconClass} />
      </div>
      {loading ? (
        <div className="mt-2 h-7 w-24 rounded-[2px] skeleton" />
      ) : (
        <div className="mt-1 text-[26px] leading-8 text-[#0F1111]">{value}</div>
      )}
      <p className={`text-[12px] mt-1 ${noteClass}`}>{note}</p>
    </div>
  );
}

export default function SellerAnalytics() {
  const [timeframe, setTimeframe] = useState('30d');
  const { data, isLoading } = useGetSellerAnalyticsQuery({ timeframe });

  const analytics = data?.data;
  const kpis = analytics?.kpis || analytics?.summary || {};
  const timeSeries = analytics?.timeSeries || analytics?.revenueOverTime || [];

  const topProducts = analytics?.topProducts || [];
  const timeframeLabel = TIMEFRAME_OPTIONS.find((o) => o.value === timeframe)?.label.toLowerCase();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-[24px] sm:text-[28px] leading-8 font-normal text-[#0F1111]">
            Sales &amp; performance
          </h1>
          <p className="text-[13px] text-[#565959] mt-1">
            Track revenue, orders, and your best-selling products.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="timeframe" className="text-[13px] text-[#565959]">
            Date range
          </label>
          <select
            id="timeframe"
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="h-[34px] px-2.5 text-[13px] bg-[#F0F2F2] hover:bg-[#E3E6E6] border border-[#D5D9D9] rounded-[8px] text-[#0F1111] cursor-pointer shadow-[0_1px_2px_rgba(15,17,17,0.1)] focus:outline-none focus:border-[#E77600] focus:shadow-[0_0_3px_2px_rgba(228,121,17,0.5)]"
          >
            {TIMEFRAME_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          label="Net revenue"
          icon={IndianRupee}
          iconClass="text-[#007185]"
          loading={isLoading}
          value={`₹${(Number(kpis.totalRevenue) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          note={kpis.totalRevenue > 0 ? "Realtime verified orders" : "No revenue in timeframe"}
          noteClass="text-[#007600]"
        />
        <KpiCard
          label="Total orders"
          icon={ShoppingBag}
          iconClass="text-[#007185]"
          loading={isLoading}
          value={(kpis.totalOrders || 0).toLocaleString('en-IN')}
          note={`${kpis.totalUnitsSold || kpis.totalOrders || 0} units sold`}
        />
        <KpiCard
          label="Average order value"
          icon={TrendingUp}
          iconClass="text-[#007185]"
          loading={isLoading}
          value={`₹${(Number(kpis.averageOrderValue) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          note="Per order"
        />
        <KpiCard
          label="Return rate"
          icon={RotateCcw}
          iconClass="text-[#B12704]"
          loading={isLoading}
          value={`${(kpis.returnRate || 0).toFixed(1)}%`}
          note="Healthy: under 3%"
          noteClass="text-[#007600]"
        />
      </div>

      {/* Charts */}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <section className="xl:col-span-2 bg-white border border-[#D5D9D9] rounded-[4px] p-4 sm:p-5">
          <h2 className="text-[18px] font-bold text-[#0F1111]">Revenue</h2>
          <p className="text-[12px] text-[#565959] mb-3">{timeframeLabel}</p>

          {timeSeries.length === 0 ? (
            <div className="h-64 sm:h-72 w-full flex flex-col items-center justify-center text-center p-4 bg-[#F7F8F8] rounded border border-dashed border-[#D5D9D9]">
              <p className="text-[13px] font-bold text-[#0F1111]">No revenue recorded in {timeframeLabel}</p>
              <p className="text-[12px] text-[#565959] mt-0.5">Transactions will be plotted automatically as orders occur.</p>
            </div>
          ) : (
            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeries} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
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
                    fill="url(#revGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="bg-white border border-[#D5D9D9] rounded-[4px] p-4 sm:p-5">
          <h2 className="text-[18px] font-bold text-[#0F1111]">Orders</h2>
          <p className="text-[12px] text-[#565959] mb-3">{timeframeLabel}</p>

          {timeSeries.length === 0 ? (
            <div className="h-64 sm:h-72 w-full flex flex-col items-center justify-center text-center p-4 bg-[#F7F8F8] rounded border border-dashed border-[#D5D9D9]">
              <p className="text-[13px] font-bold text-[#0F1111]">0 orders in {timeframeLabel}</p>
              <p className="text-[12px] text-[#565959] mt-0.5">Order volume will appear here upon customer checkout.</p>
            </div>
          ) : (
            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EAEDED" vertical={false} />
                  <XAxis dataKey="date" stroke="#767676" fontSize={11} tickLine={false} axisLine={{ stroke: '#D5D9D9' }} />
                  <YAxis stroke="#767676" fontSize={11} tickLine={false} axisLine={false} width={28} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: '#F0F2F2' }}
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(v) => [v, 'Orders']}
                  />
                  <Bar dataKey="orders" fill="#FFA41C" radius={[2, 2, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>


      {/* Top products */}
      {topProducts.length > 0 && (
        <section className="bg-white border border-[#D5D9D9] rounded-[4px] overflow-hidden">
          <h2 className="px-4 sm:px-5 py-3 text-[18px] font-bold text-[#0F1111] border-b border-[#D5D9D9]">
            Top-selling products
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead className="bg-[#F0F2F2] border-b border-[#D5D9D9]">
                <tr className="text-[#0F1111]">
                  <th className="px-4 sm:px-5 py-2.5 font-bold">Product</th>
                  <th className="px-4 py-2.5 font-bold text-right">Units sold</th>
                  <th className="px-4 sm:px-5 py-2.5 font-bold text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E7E7]">
                {topProducts.map((p, idx) => (
                  <tr key={idx} className="hover:bg-[#F7FAFA]">
                    <td className="px-4 sm:px-5 py-3 text-[#0F1111]">
                      <span className="line-clamp-2">{p.title}</span>
                    </td>
                    <td className="px-4 py-3 text-[#565959] text-right">{p.units}</td>
                    <td className="px-4 sm:px-5 py-3 text-right">
                      <Price amount={p.revenue} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}