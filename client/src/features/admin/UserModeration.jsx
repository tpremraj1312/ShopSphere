import React, { useState } from 'react';
import { useGetUsersQuery, useSuspendUserMutation, useReinstateUserMutation } from '../../store/adminApi';
import StepUpModal from './StepUpModal';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Pagination from '../../components/ui/Pagination';
import { Search, UserX, UserCheck } from 'lucide-react';

export default function UserModeration() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Step-Up Modal State
  const [stepUpOpen, setStepUpOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [reason, setReason] = useState('');
  const [feedback, setFeedback] = useState(null);

  const { data, isLoading, refetch } = useGetUsersQuery({
    page,
    limit: 15,
    search: search || undefined,
    role: roleFilter || undefined,
    status: statusFilter || undefined,
  });

  const [suspendUser, { isLoading: isSuspending }] = useSuspendUserMutation();
  const [reinstateUser, { isLoading: isReinstating }] = useReinstateUserMutation();

  const users = data?.data?.users || [];
  const pagination = data?.data?.pagination || { totalPages: 1, totalItems: users.length };

  const handleInitiateAction = (type, targetUser) => {
    setPendingAction({ type, user: targetUser });
    setReason('');
    setStepUpOpen(true);
  };

  const handleStepUpSuccess = async (stepUpToken) => {
    if (!pendingAction) return;

    try {
      if (pendingAction.type === 'suspend') {
        await suspendUser({
          id: pendingAction.user._id,
          reason: reason || 'Violation of platform policies',
          stepUpToken,
        }).unwrap();
        setFeedback({ type: 'success', message: `User ${pendingAction.user.email} suspended.` });
      } else {
        await reinstateUser({
          id: pendingAction.user._id,
          reason: reason || 'Administrative reinstatement',
          stepUpToken,
        }).unwrap();
        setFeedback({ type: 'success', message: `User ${pendingAction.user.email} reinstated.` });
      }
      refetch();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err?.data?.error?.message || err?.message || 'Operation failed.',
      });
    }
  };

  return (
    <div className="space-y-5">
      {/* Title Header */}
      <div>
        <h1 className="text-[24px] font-normal text-[#0F1111]">
          User Governance & Moderation
        </h1>
        <p className="text-[13px] text-[#565959] mt-0.5">
          Search users, manage permissions, suspend bad actors, and monitor account statuses.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-[3px] text-[13px] border ${
            feedback.type === 'success'
              ? 'bg-[#F0F8F0] border-[#007600]/30 text-[#007600]'
              : 'bg-[#FFF0F0] border-[#B12704]/30 text-[#B12704]'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="bg-white border border-[#D5D9D9] rounded-[4px] p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <input
            type="text"
            placeholder="Search users by name or email"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full h-[32px] pl-3 pr-8 text-[13px] border border-[#A6A6A6] rounded-[3px] focus:outline-none focus:border-[#E77600]"
          />
          <Search size={15} strokeWidth={2} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#565959]" />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          className="h-[32px] px-2.5 text-[12px] bg-[#F0F2F2] border border-[#D5D9D9] rounded-[3px] text-[#0F1111] cursor-pointer"
        >
          <option value="">All Roles</option>
          <option value="customer">Customer</option>
          <option value="seller">Seller</option>
          <option value="admin">Admin</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="h-[32px] px-2.5 text-[12px] bg-[#F0F2F2] border border-[#D5D9D9] rounded-[3px] text-[#0F1111] cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-[#D5D9D9] rounded-[4px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead className="bg-[#F0F2F2] border-b border-[#D5D9D9] sticky top-0">
              <tr>
                <th className="px-3.5 py-2.5 font-medium text-[#0F1111]">User</th>
                <th className="px-3.5 py-2.5 font-medium text-[#0F1111]">Role</th>
                <th className="px-3.5 py-2.5 font-medium text-[#0F1111]">Status</th>
                <th className="px-3.5 py-2.5 font-medium text-[#0F1111]">Email Verified</th>
                <th className="px-3.5 py-2.5 font-medium text-[#0F1111]">Joined Date</th>
                <th className="px-3.5 py-2.5 font-medium text-[#0F1111] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D5D9D9]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#565959]">
                    Loading user records...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#565959]">
                    No users matching criteria found.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSuspended = u.status === 'suspended';
                  return (
                    <tr key={u._id} className="hover:bg-[#F7FAFA] transition-colors">
                      <td className="px-3.5 py-2.5">
                        <div className="font-medium text-[#0F1111]">{u.name || 'Anonymous User'}</div>
                        <div className="text-[12px] text-[#565959]">{u.email}</div>
                      </td>
                      <td className="px-3.5 py-2.5 uppercase font-mono text-[11px] text-[#565959]">
                        {u.role}
                      </td>
                      <td className="px-3.5 py-2.5">
                        <Badge variant={isSuspended ? 'lowStock' : 'inStock'} size="sm">
                          {isSuspended ? 'Suspended' : 'Active'}
                        </Badge>
                      </td>
                      <td className="px-3.5 py-2.5 text-[12px]">
                        {u.isEmailVerified ? (
                          <span className="text-[#007600] font-medium">Verified</span>
                        ) : (
                          <span className="text-[#767676]">Pending</span>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5 text-[#565959] text-[12px]">
                        {new Date(u.createdAt || Date.now()).toLocaleDateString()}
                      </td>
                      <td className="px-3.5 py-2.5 text-right">
                        {isSuspended ? (
                          <Button
                            variant="secondary"
                            size="compact"
                            onClick={() => handleInitiateAction('reinstate', u)}
                          >
                            Reinstate
                          </Button>
                        ) : (
                          <Button
                            variant="danger"
                            size="compact"
                            onClick={() => handleInitiateAction('suspend', u)}
                          >
                            Suspend
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <Pagination
          currentPage={page}
          totalPages={pagination.totalPages || 1}
          totalItems={pagination.totalItems}
          onPageChange={setPage}
        />
      </div>

      {/* Step-Up Re-Authentication Modal */}
      <StepUpModal
        isOpen={stepUpOpen}
        onClose={() => setStepUpOpen(false)}
        onSuccess={handleStepUpSuccess}
        actionTitle={
          pendingAction?.type === 'suspend'
            ? `Suspend ${pendingAction?.user?.email}`
            : `Reinstate ${pendingAction?.user?.email}`
        }
      />
    </div>
  );
}
