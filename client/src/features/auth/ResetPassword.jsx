import React, { useState } from 'react';
import { useSearchParams, useParams, useNavigate, Link } from 'react-router-dom';
import { useResetPasswordMutation } from '../../store/authApi';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const { token: paramToken } = useParams();
  const initialToken = paramToken || searchParams.get('token') || '';

  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const [resetPassword, { isLoading, error }] = useResetPasswordMutation();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    if (!token) {
      setValidationError('Reset token is required');
      return;
    }

    try {
      await resetPassword({ token, password }).unwrap();
      setIsSuccess(true);
    } catch (err) {
      console.error('Password reset failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center pt-8 pb-16 px-4">
      <Link
        to="/"
        className="text-[28px] font-semibold text-[#0F1111] hover:text-[#C7511F] mb-4 tracking-tight"
      >
        ShopSphere
      </Link>

      <div className="w-full max-w-[350px] p-6 border border-[#D5D9D9] rounded-[4px] bg-white">
        <h1 className="text-[24px] font-normal text-[#0F1111] mb-2">
          Create new password
        </h1>
        <p className="text-[13px] text-[#565959] mb-4 leading-normal">
          We'll ask for this password whenever you sign in.
        </p>

        {isSuccess ? (
          <div className="space-y-4">
            <div className="p-3.5 rounded-[3px] bg-[#F0F8F0] border-l-4 border-l-[#007600] border border-[#D5D9D9] text-[#0F1111] text-[13px]">
              <p className="font-semibold text-[#007600] mb-1">Password updated</p>
              <p>Your password has been successfully reset. You can now sign in with your new password.</p>
            </div>
            <Link to="/login" className="block w-full">
              <Button variant="primary" size="form" fullWidth>
                Sign in
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {(validationError || error) && (
              <div className="p-3 rounded-[3px] bg-[#FFF0F0] border-l-4 border-l-[#B12704] text-[#B12704] text-[12px]">
                {validationError || error?.data?.error?.message || 'Password reset failed'}
              </div>
            )}

            {!initialToken && (
              <Input
                label="Reset Token"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
            )}

            <Input
              label="New password"
              type="password"
              placeholder="At least 8 characters"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Input
              label="Re-enter password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <Button
              variant="primary"
              size="form"
              fullWidth
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? 'Updating...' : 'Save changes and sign in'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
