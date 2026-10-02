import React, { useState } from 'react';
import { useVerifyStepUpMutation } from '../../store/adminApi';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { ShieldAlert } from 'lucide-react';

/**
 * StepUpModal — elevated action re-authentication modal (ADM-FR-05, SEC-06).
 * Adheres to Amazon-style dialog design with no emoji.
 */
export default function StepUpModal({
  isOpen,
  onClose,
  onSuccess,
  actionTitle = 'Sensitive Action',
}) {
  const [method, setMethod] = useState('password');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [verifyStepUp, { isLoading }] = useVerifyStepUpMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      const payload = method === 'password' ? { password } : { code };
      const res = await verifyStepUp(payload).unwrap();
      if (res?.data?.stepUpToken) {
        onSuccess(res.data.stepUpToken);
        onClose();
      } else {
        setErrorMsg('Authentication failed. No elevated token received.');
      }
    } catch (err) {
      setErrorMsg(err?.data?.error?.message || err?.message || 'Verification failed. Please check credentials.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Step-Up Verification Required"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-[#FFF8F2] border border-[#FFA41C]/40 rounded-[3px] text-[#0F1111] text-[13px]">
          <ShieldAlert size={20} strokeWidth={1.75} className="text-[#C45500] shrink-0" />
          <div>
            <span className="font-semibold">Privileged Action:</span> {actionTitle}
            <div className="text-[12px] text-[#565959]">
              Re-enter your credentials to receive an elevated session token.
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-[#FFF0F0] border-l-4 border-l-[#B12704] text-[12px] text-[#B12704] rounded-[2px]">
            {errorMsg}
          </div>
        )}

        {/* Auth method selection */}
        <div className="flex gap-2 border-b border-[#D5D9D9] pb-2 text-[13px]">
          <button
            type="button"
            onClick={() => setMethod('password')}
            className={`px-3 py-1 text-[13px] font-medium transition-colors ${
              method === 'password'
                ? 'border-b-2 border-[#E77600] font-semibold text-[#0F1111]'
                : 'text-[#565959] hover:text-[#0F1111]'
            }`}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => setMethod('totp')}
            className={`px-3 py-1 text-[13px] font-medium transition-colors ${
              method === 'totp'
                ? 'border-b-2 border-[#E77600] font-semibold text-[#0F1111]'
                : 'text-[#565959] hover:text-[#0F1111]'
            }`}
          >
            Authenticator Code
          </button>
        </div>

        {method === 'password' ? (
          <Input
            label="Admin Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        ) : (
          <Input
            label="6-Digit TOTP Code"
            type="text"
            placeholder="123456"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="secondary"
            size="compact"
            type="button"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="compact"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Verifying...' : 'Authenticate'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
