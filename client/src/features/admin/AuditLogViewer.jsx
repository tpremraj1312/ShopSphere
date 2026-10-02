import React, { useState } from 'react';
import { useGetAuditLogsQuery } from '../../store/adminApi';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import { ScrollText, Filter, Eye } from 'lucide-react';

export default function AuditLogViewer() {
  const [actionFilter, setActionFilter] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedEntry, setSelectedEntry] = useState(null);

  const { data, isLoading } = useGetAuditLogsQuery({
    page,
    limit: 20,
    action: actionFilter || undefined,
    targetType: targetTypeFilter || undefined,
  });

  const logs = data?.data?.entries || [];
  const pagination = data?.data?.pagination || { totalPages: 1, totalItems: logs.length };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[24px] font-normal text-[#0F1111]">
          Cryptographic Audit Trail (SEC-21)
        </h1>
        <p className="text-[13px] text-[#565959] mt-0.5">
          Tamper-evident, append-only records of privileged administrative actions and state changes.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#D5D9D9] rounded-[4px] p-4 flex flex-wrap items-center gap-3">
        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          className="h-[32px] px-2.5 text-[12px] bg-[#F0F2F2] border border-[#D5D9D9] rounded-[3px] text-[#0F1111] cursor-pointer"
        >
          <option value="">All Privileged Actions</option>
          <option value="user.suspend">user.suspend</option>
          <option value="user.reinstate">user.reinstate</option>
          <option value="listing.unpublish">listing.unpublish</option>
          <option value="listing.republish">listing.republish</option>
          <option value="order.force_refund">order.force_refund</option>
          <option value="admin.step_up_auth">admin.step_up_auth</option>
          <option value="admin.2fa_setup">admin.2fa_setup</option>
        </select>

        <select
          value={targetTypeFilter}
          onChange={(e) => {
            setTargetTypeFilter(e.target.value);
            setPage(1);
          }}
          className="h-[32px] px-2.5 text-[12px] bg-[#F0F2F2] border border-[#D5D9D9] rounded-[3px] text-[#0F1111] cursor-pointer"
        >
          <option value="">All Target Types</option>
          <option value="user">User</option>
          <option value="product">Product</option>
          <option value="order">Order</option>
          <option value="system">System</option>
        </select>
      </div>

      {/* Log Table */}
      <div className="bg-white border border-[#D5D9D9] rounded-[4px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead className="bg-[#F0F2F2] border-b border-[#D5D9D9] sticky top-0">
              <tr>
                <th className="px-3.5 py-2.5 font-medium text-[#0F1111]">Timestamp</th>
                <th className="px-3.5 py-2.5 font-medium text-[#0F1111]">Action</th>
                <th className="px-3.5 py-2.5 font-medium text-[#0F1111]">Actor</th>
                <th className="px-3.5 py-2.5 font-medium text-[#0F1111]">Target ID</th>
                <th className="px-3.5 py-2.5 font-medium text-[#0F1111]">IP Address</th>
                <th className="px-3.5 py-2.5 font-medium text-[#0F1111]">Status</th>
                <th className="px-3.5 py-2.5 font-medium text-[#0F1111] text-right">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D5D9D9]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#565959]">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#565959]">
                    No audit records found matching criteria.
                  </td>
                </tr>
              ) : (
                logs.map((entry) => (
                  <tr key={entry._id} className="hover:bg-[#F7FAFA] transition-colors">
                    <td className="px-3.5 py-2 text-[#565959] text-[12px] whitespace-nowrap">
                      {new Date(entry.timestamp || Date.now()).toLocaleString()}
                    </td>
                    <td className="px-3.5 py-2 font-mono text-[12px] font-medium text-[#0F1111]">
                      {entry.action}
                    </td>
                    <td className="px-3.5 py-2 text-[12px] text-[#0F1111]">
                      {entry.actorId?.email || entry.actorId?.name || 'System'}
                    </td>
                    <td className="px-3.5 py-2 font-mono text-[11px] text-[#565959]">
                      {entry.targetId || '-'}
                    </td>
                    <td className="px-3.5 py-2 font-mono text-[12px] text-[#0F1111]">
                      {entry.ipAddress || '127.0.0.1'}
                    </td>
                    <td className="px-3.5 py-2">
                      <Badge variant={entry.status === 'success' ? 'inStock' : 'lowStock'} size="sm">
                        {entry.status || 'OK'}
                      </Badge>
                    </td>
                    <td className="px-3.5 py-2 text-right">
                      <Button
                        variant="secondary"
                        size="compact"
                        onClick={() => setSelectedEntry(entry)}
                      >
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={page}
          totalPages={pagination.totalPages || 1}
          totalItems={pagination.totalItems}
          onPageChange={setPage}
        />
      </div>

      {/* Inspect Payload Modal */}
      <Modal
        isOpen={Boolean(selectedEntry)}
        onClose={() => setSelectedEntry(null)}
        title={`Audit Event: ${selectedEntry?.action}`}
      >
        <div className="space-y-3">
          <div className="text-[12px] text-[#565959]">
            Event ID: <span className="font-mono text-[#0F1111]">{selectedEntry?._id}</span>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#0F1111] mb-1">
              Recorded Payload & Metadata:
            </label>
            <pre className="p-3 bg-[#F0F2F2] border border-[#D5D9D9] rounded-[3px] text-[11px] font-mono text-[#0F1111] overflow-x-auto max-h-60">
              {JSON.stringify(selectedEntry?.details || selectedEntry?.metadata || selectedEntry, null, 2)}
            </pre>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="secondary"
              size="compact"
              onClick={() => setSelectedEntry(null)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
