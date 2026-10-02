import React from 'react';
import { useGetSessionsQuery, useRevokeSessionMutation } from '../../store/authApi';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import { Laptop, Smartphone, ShieldCheck, RefreshCw } from 'lucide-react';

export default function Sessions() {
  const { data, isLoading, error, refetch } = useGetSessionsQuery();
  const [revokeSession, { isLoading: isRevoking }] = useRevokeSessionMutation();

  const handleRevoke = async (id) => {
    try {
      await revokeSession(id).unwrap();
      refetch();
    } catch (err) {
      console.error('Failed to revoke session:', err);
    }
  };

  const sessions = data?.data || [];

  return (
    <div className="bg-[#EAEDED] min-h-[calc(100vh-280px)] py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-4">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Your Account', href: '/orders' },
            { label: 'Login & Security', href: '#' },
            { label: 'Active Sessions' },
          ]}
        />

        <div className="bg-white border border-[#D5D9D9] rounded-[4px] p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D5D9D9]">
            <div>
              <h1 className="text-[21px] font-semibold text-[#0F1111]">
                Active Sessions & Devices
              </h1>
              <p className="text-[13px] text-[#565959] mt-0.5">
                Review and sign out of active devices currently logged into your account.
              </p>
            </div>
            <Button
              variant="secondary"
              size="compact"
              onClick={() => refetch()}
              className="inline-flex items-center gap-1.5"
            >
              <RefreshCw size={13} strokeWidth={2} />
              Refresh
            </Button>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-[#565959] text-[13px]">
              Loading active sessions...
            </div>
          ) : error ? (
            <div className="p-3 bg-[#FFF0F0] border-l-4 border-l-[#B12704] text-[13px] text-[#B12704] rounded-[2px]">
              {error.data?.error?.message || 'Failed to load sessions.'}
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-8 text-center text-[#565959] text-[13px]">
              No active devices or sessions found.
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session, index) => (
                <div
                  key={session.id || session._id || index}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-[3px] border border-[#D5D9D9] bg-[#F7FAFA] hover:bg-white transition-colors gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-[3px] bg-white border border-[#D5D9D9] flex items-center justify-center text-[#565959] shrink-0 mt-0.5">
                      {session.userAgent?.toLowerCase().includes('mobile') ? (
                        <Smartphone size={18} strokeWidth={1.75} />
                      ) : (
                        <Laptop size={18} strokeWidth={1.75} />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-semibold text-[#0F1111]">
                          {session.device || session.userAgent?.split(' ')[0] || 'Web Browser'}
                        </span>
                        {index === 0 && (
                          <Badge variant="inStock" size="sm">Current Session</Badge>
                        )}
                      </div>
                      <div className="text-[12px] text-[#565959] mt-0.5 space-x-2">
                        <span>IP: <code className="font-mono text-[#0F1111]">{session.ipAddress || '127.0.0.1'}</code></span>
                        <span>·</span>
                        <span>Last active: {new Date(session.lastActive || Date.now()).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {index !== 0 && (
                    <Button
                      variant="secondary"
                      size="compact"
                      onClick={() => handleRevoke(session.id || session._id)}
                      disabled={isRevoking}
                    >
                      Sign Out Device
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="pt-4 border-t border-[#D5D9D9] flex items-center gap-2 text-[12px] text-[#565959]">
            <ShieldCheck size={16} strokeWidth={1.75} className="text-[#007600]" />
            <span>If you notice suspicious activity, revoke the session immediately and update your password.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
