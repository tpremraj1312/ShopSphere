import React, { useState } from 'react';
import { useLoginMutation } from '../../store/authApi';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../store/authSlice';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [login, { isLoading, error }] = useLoginMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await login({ email, password }).unwrap();
      dispatch(
        setCredentials({
          user: response.data.user,
          token: response.data.accessToken,
        })
      );
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Failed to log in', err);
    }
  };

  const isUnverified = error?.data?.error?.code === 'EMAIL_NOT_VERIFIED';

  return (
    <div className="min-h-screen bg-white flex flex-col items-center pt-8 pb-16 px-4">
      {/* Logo */}
      <Link
        to="/"
        className="text-[28px] font-semibold text-[#0F1111] hover:text-[#C7511F] mb-4 tracking-tight"
      >
        ShopSphere
      </Link>

      {/* 350px Centered Card */}
      <div className="w-full max-w-[350px] p-6 border border-[#D5D9D9] rounded-[4px] bg-white">
        <h1 className="text-[24px] font-normal text-[#0F1111] mb-4">Sign in</h1>

        {error && (
          <div className="p-3 rounded-[3px] bg-[#FFF0F0] border-l-4 border-l-[#B12704] border border-[#D5D9D9] text-[#B12704] text-[12px] mb-4">
            <p className="font-semibold">There was a problem</p>
            <p>{error.data?.error?.message || 'Invalid email or password.'}</p>
            {isUnverified && (
              <p className="mt-1">
                Please check your inbox to verify your email address.
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <Input
            label="Email or mobile phone number"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[13px] font-medium text-[#0F1111]">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-[12px] text-[#007185] hover:text-[#C7511F] hover:underline"
              >
                Forgot your password?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-[34px] px-2.5 py-1 text-[14px] text-[#0F1111] bg-white border border-[#A6A6A6] rounded-[3px] focus:outline-none focus:border-[#E77600] focus:ring-3 focus:ring-[rgba(228,121,17,0.5)]"
            />
          </div>

          <div className="pt-1">
            <Button
              variant="primary"
              size="form"
              fullWidth
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </div>
        </form>

        <p className="text-[11px] text-[#565959] mt-4 leading-normal">
          By continuing, you agree to ShopSphere's{' '}
          <Link to="#" className="text-[#007185] hover:underline">
            Conditions of Use
          </Link>{' '}
          and{' '}
          <Link to="#" className="text-[#007185] hover:underline">
            Privacy Notice
          </Link>
          .
        </p>
      </div>

      {/* New to ShopSphere Divider */}
      <div className="w-full max-w-[350px] mt-6 text-center">
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-[#D5D9D9]"></div>
          <span className="flex-shrink mx-3 text-[12px] text-[#767676]">
            New to ShopSphere?
          </span>
          <div className="flex-grow border-t border-[#D5D9D9]"></div>
        </div>

        <Link to="/register" className="block mt-2">
          <Button variant="secondary" size="form" fullWidth>
            Create your ShopSphere account
          </Button>
        </Link>
      </div>
    </div>
  );
}
