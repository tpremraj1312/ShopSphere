import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  useGet2FAStatusQuery,
  useSetup2FAMutation,
  useVerify2FAMutation,
  useDisable2FAMutation,
} from '../../store/adminApi';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import { ShieldCheck, ShieldAlert, KeyRound, Check } from 'lucide-react';

export default function SecuritySettings() {
  const { user } = useSelector((state) => state.auth);

  const { data: statusData, isLoading: statusLoading, refetch } = useGet2FAStatusQuery();
  const [setup2FA, { isLoading: isSettingUp }] = useSetup2FAMutation();
  const [verify2FA, { isLoading: isVerifying }] = useVerify2FAMutation();
  const [disable2FA, { isLoading: isDisabling }] = useDisable2FAMutation();

  const isEnabled = statusData?.data?.twoFactorEnabled;

  // Setup Flow State
  const [setupData, setSetupData] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [confirmedCodes, setConfirmedCodes] = useState(false);

  const handleStartSetup = async () => {
    setFeedback(null);
    try {
      const res = await setup2FA().unwrap();
      setSetupData(res.data);
      setConfirmedCodes(false);
      setVerificationCode('');
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err?.data?.error?.message || err?.message || 'Could not initiate 2FA setup.',
      });
    }
  };

  const handleVerifySetup = async (e) => {
    e.preventDefault();
    setFeedback(null);
    try {
      await verify2FA({ code: verificationCode }).unwrap();
      setFeedback({
        type: 'success',
        message: 'Two-factor authentication successfully enabled on your account!',
      });
      setSetupData(null);
      refetch();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err?.data?.error?.message || err?.message || 'Invalid verification code.',
      });
    }
  };

  const handleDisable = async () => {
    if (!window.confirm('Disable two-factor authentication? Your account will have lower security protection.')) {
      return;
    }
    setFeedback(null);
    try {
      await disable2FA().unwrap();
      setFeedback({
        type: 'success',
        message: 'Two-factor authentication has been disabled.',
      });
      refetch();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err?.data?.error?.message || 'Failed to disable 2FA.',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-normal text-[#0F1111]">
          Login & Security Settings
        </h1>
        <p className="text-[13px] text-[#565959] mt-0.5">
          Manage two-factor authentication (2FA), authenticator apps, and account recovery.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-[3px] text-[13px] border ${
            feedback.type === 'success'
              ? 'bg-[#F0F8F0] border-[#007600]/30 text-[#007600]'
              : 'bg-[#FFF0F0] border-[#B12704]/30 text-[#B12704]'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* 2FA Status Card */}
      <div className="bg-white border border-[#D5D9D9] rounded-[4px] p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D5D9D9]">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-[3px] bg-[#F0F2F2] flex items-center justify-center text-[#0F1111] shrink-0">
              <KeyRound size={20} strokeWidth={1.75} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[16px] font-semibold text-[#0F1111]">
                  Two-Step Verification (2FA)
                </h2>
                <Badge variant={isEnabled ? 'inStock' : 'neutral'} size="sm">
                  {isEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <p className="text-[13px] text-[#565959] mt-1">
                Protect your account by requiring an authenticator code in addition to your password.
              </p>
            </div>
          </div>

          <div>
            {isEnabled ? (
              <Button
                variant="danger"
                size="compact"
                onClick={handleDisable}
                disabled={isDisabling}
              >
                Disable 2FA
              </Button>
            ) : (
              <Button
                variant="primary"
                size="form"
                onClick={handleStartSetup}
                disabled={isSettingUp || Boolean(setupData)}
              >
                Set up 2FA
              </Button>
            )}
          </div>
        </div>

        {/* 2FA Setup Flow */}
        {setupData && (
          <div className="p-5 bg-[#F7FAFA] border border-[#D5D9D9] rounded-[3px] space-y-5">
            <h3 className="text-[15px] font-semibold text-[#0F1111]">
              Enroll Authenticator App
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Step 1: Scan QR */}
              <div className="space-y-3">
                <div className="text-[13px] font-medium text-[#0F1111]">
                  Step 1: Scan QR Code with Google Authenticator or Authy
                </div>
                <div className="w-48 h-48 bg-white p-2 border border-[#D5D9D9] rounded-[3px] flex items-center justify-center">
                  {setupData.qrCodeDataUrl ? (
                    <img
                      src={setupData.qrCodeDataUrl}
                      alt="2FA QR Code"
                      className="max-h-full max-w-full"
                    />
                  ) : (
                    <span className="text-[12px] text-[#565959] text-center font-mono">
                      Secret: {setupData.secret}
                    </span>
                  )}
                </div>
                <div className="text-[12px] text-[#565959]">
                  Manual Entry Key:{' '}
                  <code className="bg-white px-2 py-0.5 border border-[#D5D9D9] rounded-[2px] font-mono text-[#0F1111]">
                    {setupData.secret}
                  </code>
                </div>
              </div>

              {/* Step 2: Confirm Code */}
              <form onSubmit={handleVerifySetup} className="space-y-4">
                <div className="text-[13px] font-medium text-[#0F1111]">
                  Step 2: Enter 6-Digit Code
                </div>
                <Input
                  label="Authentication Code"
                  placeholder="000000"
                  required
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                />

                {setupData.recoveryCodes && (
                  <div className="p-3 bg-white border border-[#D5D9D9] rounded-[3px] space-y-2">
                    <span className="text-[12px] font-semibold text-[#0F1111] block">
                      Emergency Recovery Codes (Save these securely)
                    </span>
                    <div className="grid grid-cols-2 gap-1 text-[11px] font-mono text-[#565959]">
                      {setupData.recoveryCodes.map((c, i) => (
                        <div key={i}>{c}</div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="primary"
                    size="compact"
                    type="submit"
                    disabled={isVerifying || verificationCode.length < 6}
                  >
                    {isVerifying ? 'Verifying...' : 'Verify & Activate'}
                  </Button>
                  <Button
                    variant="secondary"
                    size="compact"
                    type="button"
                    onClick={() => setSetupData(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
