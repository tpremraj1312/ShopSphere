import React from 'react';
import { Link } from 'react-router-dom';
import { useGetPlatformMetricsQuery, useGetAuditLogsQuery } from '../../store/adminApi';
import Price from '../../components/ui/Price';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { DollarSign, Users, Store, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function AdminDashboard() {
  const { data: metricsData, isLoading: metricsLoading } = useGetPlatformMetricsQuery();
  const { data: auditData, isLoading: auditLoading } = useGetAuditLogsQuery({ limit: 6 });

  const metrics = metricsData?.data;
  const recentLogs = auditData?.data?.entries || [];

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div>
        <h1 className="text-[24px] font-normal text-[#0F1111]">
          Administrative Command Center
        </h1>
        <p className="text-[13px] text-[#565959] mt-0.5">
          Platform-wide metrics, security governance, and audit trails.
        </p>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#D5D9D9] rounded-[4px] p-4">
          <div className="flex items-center justify-between text-[#565959] mb-1">
            <span className="text-[12px] font-medium uppercase tracking-wider">Gross Merchandise Value</span>
            <DollarSign size={18} strokeWidth={1.75} className="text-[#007185]" />
          </div>
          <div className="text-[22px] font-medium text-[#0F1111]">
            {metricsLoading ? '...' : `$${(metrics?.orders?.totalGMV || 0).toLocaleString()}`}
          </div>
          <p className="text-[11px] text-[#007600] mt-1 font-medium">
            Live marketplace volume
          </p>
        </div>

        <div className="bg-white border border-[#D5D9D9] rounded-[4px] p-4">
          <div className="flex items-center justify-between text-[#565959] mb-1">
            <span className="text-[12px] font-medium uppercase tracking-wider">Total Users</span>
            <Users size={18} strokeWidth={1.75} className="text-[#007185]" />
          </div>
          <div className="text-[22px] font-medium text-[#0F1111]">
            {metricsLoading ? '...' : metrics?.users?.total || 0}
          </div>
          <div className="text-[11px] text-[#565959] mt-1 flex items-center gap-2">
            <span className="text-[#007600]">{metrics?.users?.active || 0} Active</span>
            <span>·</span>
            <span className="text-[#B12704]">{metrics?.users?.suspended || 0} Suspended</span>
          </div>
        </div>

        <div className="bg-white border border-[#D5D9D9] rounded-[4px] p-4">
          <div className="flex items-center justify-between text-[#565959] mb-1">
            <span className="text-[12px] font-medium uppercase tracking-wider">Active Merchants</span>
            <Store size={18} strokeWidth={1.75} className="text-[#007185]" />
          </div>
          <div className="text-[22px] font-medium text-[#0F1111]">
            {metricsLoading ? '...' : metrics?.users?.sellers || 0}
          </div>
          <p className="text-[11px] text-[#565959] mt-1">Verified marketplace vendors</p>
        </div>

        <div className="bg-white border border-[#D5D9D9] rounded-[4px] p-4">
          <div className="flex items-center justify-between text-[#565959] mb-1">
            <span className="text-[12px] font-medium uppercase tracking-wider">Pending Listings</span>
            <AlertTriangle size={18} strokeWidth={1.75} className="text-[#FFA41C]" />
          </div>
          <div className="text-[22px] font-medium text-[#0F1111]">
            {metricsLoading ? '...' : metrics?.products?.flagged || 0}
          </div>
          <p className="text-[11px] text-[#565959] mt-1">Awaiting moderation review</p>
        </div>
      </div>

      {/* Moderation & Governance Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/admin/users"
          className="bg-white border border-[#D5D9D9] hover:border-[#A6A6A6] rounded-[4px] p-4 flex items-center justify-between group transition-colors"
        >
          <div>
            <h3 className="text-[15px] font-semibold text-[#0F1111] group-hover:text-[#C7511F]">
              User Governance
            </h3>
            <p className="text-[12px] text-[#565959] mt-0.5">Manage accounts, suspensions & RBAC</p>
          </div>
          <ArrowRight size={16} strokeWidth={2} className="text-[#007185] group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          to="/admin/products"
          className="bg-white border border-[#D5D9D9] hover:border-[#A6A6A6] rounded-[4px] p-4 flex items-center justify-between group transition-colors"
        >
          <div>
            <h3 className="text-[15px] font-semibold text-[#0F1111] group-hover:text-[#C7511F]">
              Listing Moderation
            </h3>
            <p className="text-[12px] text-[#565959] mt-0.5">Approve, review, or delist products</p>
          </div>
          <ArrowRight size={16} strokeWidth={2} className="text-[#007185] group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          to="/admin/audit"
          className="bg-white border border-[#D5D9D9] hover:border-[#A6A6A6] rounded-[4px] p-4 flex items-center justify-between group transition-colors"
        >
          <div>
            <h3 className="text-[15px] font-semibold text-[#0F1111] group-hover:text-[#C7511F]">
              Cryptographic Audit Log
            </h3>
            <p className="text-[12px] text-[#565959] mt-0.5">Tamper-evident administrative history</p>
          </div>
          <ArrowRight size={16} strokeWidth={2} className="text-[#007185] group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Recent Audit Activity Table */}
      <div className="bg-white border border-[#D5D9D9] rounded-[4px] p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#D5D9D9]">
          <h2 className="text-[16px] font-semibold text-[#0F1111]">Recent Audit Trail</h2>
          <Link to="/admin/audit" className="text-[12px] text-[#007185] hover:text-[#C7511F] hover:underline font-medium">
            View full log
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead className="bg-[#F0F2F2] border-b border-[#D5D9D9]">
              <tr>
                <th className="px-3.5 py-2 font-medium text-[#0F1111]">Timestamp</th>
                <th className="px-3.5 py-2 font-medium text-[#0F1111]">Action</th>
                <th className="px-3.5 py-2 font-medium text-[#0F1111]">Actor</th>
                <th className="px-3.5 py-2 font-medium text-[#0F1111]">IP Address</th>
                <th className="px-3.5 py-2 font-medium text-[#0F1111]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D5D9D9]">
              {auditLoading ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-[#565959]">
                    Loading audit trail...
                  </td>
                </tr>
              ) : recentLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-[#565959]">
                    No audit records recorded yet.
                  </td>
                </tr>
              ) : (
                recentLogs.map((log, idx) => (
                  <tr key={log._id || idx} className="hover:bg-[#F7FAFA] transition-colors">
                    <td className="px-3.5 py-2 text-[#565959] text-[12px] whitespace-nowrap">
                      {new Date(log.timestamp || Date.now()).toLocaleTimeString()}
                    </td>
                    <td className="px-3.5 py-2 font-mono text-[12px] text-[#0F1111]">
                      {log.action}
                    </td>
                    <td className="px-3.5 py-2 text-[#0F1111]">{log.actorId?.email || log.actor || 'System'}</td>
                    <td className="px-3.5 py-2 font-mono text-[12px] text-[#565959]">{log.ipAddress || '127.0.0.1'}</td>
                    <td className="px-3.5 py-2">
                      <Badge variant={log.status === 'success' ? 'inStock' : 'lowStock'} size="sm">
                        {log.status || 'OK'}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
