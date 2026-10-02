import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForgotPasswordMutation } from '../../store/authApi';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [forgotPassword, { isLoading, error }] = useForgotPasswordMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await forgotPassword({ email }).unwrap();
      setSubmitted(true);
    } catch (err) {
      console.error('Forgot password error:', err);
      setSubmitted(true);
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
          Password assistance
        </h1>
        <p className="text-[13px] text-[#565959] mb-4 leading-normal">
          Enter the email address associated with your ShopSphere account.
        </p>

        {submitted ? (
          <div className="space-y-4">
            <div className="p-3.5 rounded-[3px] bg-[#F0F8F0] border-l-4 border-l-[#007600] border border-[#D5D9D9] text-[#0F1111] text-[13px]">
              If an account with that email exists, we have sent instructions to reset your password.
            </div>
            <Link to="/login" className="block w-full">
              <Button variant="primary" size="form" fullWidth>
                Return to sign in
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-[3px] bg-[#FFF0F0] border-l-4 border-l-[#B12704] text-[#B12704] text-[12px]">
                {error.data?.error?.message || 'Failed to request password reset'}
              </div>
            )}

            <Input
              label="Email address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Button
              variant="primary"
              size="form"
              fullWidth
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? 'Sending request...' : 'Continue'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
