import React from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useVerifyEmailQuery } from '../../store/authApi';
import Button from '../../components/ui/Button';
import { MailCheck, AlertTriangle } from 'lucide-react';

export default function VerifyEmail() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const verificationToken = token || searchParams.get('token');
  const { data, error, isLoading, isSuccess } = useVerifyEmailQuery(verificationToken, {
    skip: !verificationToken,
  });

  return (
    <div className="min-h-screen bg-white flex flex-col items-center pt-8 pb-16 px-4">
      <Link
        to="/"
        className="text-[28px] font-semibold text-[#0F1111] hover:text-[#C7511F] mb-4 tracking-tight"
      >
        ShopSphere
      </Link>

      <div className="w-full max-w-[380px] p-6 border border-[#D5D9D9] rounded-[4px] bg-white text-center">
        <h1 className="text-[24px] font-normal text-[#0F1111] mb-4">
          Email Verification
        </h1>

        {isLoading && (
          <div className="py-6 space-y-3">
            <div className="w-8 h-8 border-3 border-[#E77600] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[13px] text-[#565959]">Verifying your email token...</p>
          </div>
        )}

        {isSuccess && (
          <div className="space-y-4">
            <div className="w-12 h-12 bg-[#F0F8F0] text-[#007600] rounded-full flex items-center justify-center mx-auto">
              <MailCheck size={28} strokeWidth={2} />
            </div>
            <div className="p-3 bg-[#F0F8F0] border border-[#007600]/30 rounded-[3px] text-[13px] text-[#007600] font-medium">
              {data?.data?.message || 'Your email has been verified successfully!'}
            </div>
            <p className="text-[13px] text-[#565959]">
              You can now sign in to your ShopSphere account.
            </p>
            <Button
              variant="primary"
              size="form"
              fullWidth
              onClick={() => navigate('/login')}
            >
              Sign in to your account
            </Button>
          </div>
        )}

        {error && (
          <div className="space-y-4">
            <div className="w-12 h-12 bg-[#FFF0F0] text-[#B12704] rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle size={28} strokeWidth={2} />
            </div>
            <div className="p-3 bg-[#FFF0F0] border border-[#B12704]/30 rounded-[3px] text-[13px] text-[#B12704]">
              {error?.data?.error?.message || 'Verification link is invalid or has expired.'}
            </div>
            <Link to="/login" className="block w-full">
              <Button variant="secondary" size="form" fullWidth>
                Back to Sign in
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
