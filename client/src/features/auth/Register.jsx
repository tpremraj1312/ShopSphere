import React, { useState } from 'react';
import { useRegisterMutation } from '../../store/authApi';
import { useNavigate, Link } from 'react-router-dom';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Info } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const [register, { isLoading, error }] = useRegisterMutation();
  const navigate = useNavigate();

  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: '', class: '', textClass: '' };
    let score = 0;
    if (pass.length >= 8) score++;
    if (pass.length >= 12) score++;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score++;

    switch (score) {
      case 1:
        return { score: 1, label: 'Weak', class: 'strength-weak', textClass: 'text-[#B12704]' };
      case 2:
        return { score: 2, label: 'Fair', class: 'strength-fair', textClass: 'text-[#E77600]' };
      case 3:
        return { score: 3, label: 'Good', class: 'strength-good', textClass: 'text-[#007185]' };
      case 4:
        return { score: 4, label: 'Strong', class: 'strength-strong', textClass: 'text-[#007600]' };
      default:
        return { score: 1, label: 'Weak', class: 'strength-weak', textClass: 'text-[#B12704]' };
    }
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (password.length < 8) {
      setValidationError('Passwords must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    try {
      await register({ name, email, password }).unwrap();
      setRegistrationSuccess(true);
    } catch (err) {
      console.error('Failed to register', err);
    }
  };

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
        <h1 className="text-[24px] font-normal text-[#0F1111] mb-4">
          Create account
        </h1>

        {registrationSuccess ? (
          <div className="space-y-4">
            <div className="p-3.5 rounded-[3px] bg-[#F0F8F0] border-l-4 border-l-[#007600] border border-[#D5D9D9] text-[#0F1111] text-[13px]">
              <p className="font-semibold text-[#007600] mb-1">Verify email address</p>
              <p>
                We have sent an email with a verification link to <strong className="text-[#0F1111]">{email}</strong>. Please check your inbox and verify your address.
              </p>
            </div>
            <Link to="/login" className="block w-full">
              <Button variant="primary" size="form" fullWidth>
                Continue to sign in
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {(validationError || error) && (
              <div className="p-3 rounded-[3px] bg-[#FFF0F0] border-l-4 border-l-[#B12704] border border-[#D5D9D9] text-[#B12704] text-[12px] mb-4">
                <p className="font-semibold">There was a problem</p>
                <p>{validationError || error?.data?.error?.message || 'Failed to create account.'}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <Input
                label="Your name"
                placeholder="First and last name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <Input
                label="Mobile number or email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <div>
                <label className="block text-[13px] font-medium text-[#0F1111] mb-1">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="At least 8 characters"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-[34px] px-2.5 py-1 text-[14px] text-[#0F1111] bg-white border border-[#A6A6A6] rounded-[3px] focus:outline-none focus:border-[#E77600] focus:ring-3 focus:ring-[rgba(228,121,17,0.5)]"
                />
                <div className="flex items-center gap-1.5 text-[11px] text-[#565959] mt-1">
                  <Info size={13} strokeWidth={2} />
                  <span>Passwords must be at least 8 characters.</span>
                </div>
                {password && (
                  <div className="mt-2">
                    <div className="strength-meter">
                      <div className={`strength-meter-fill ${strength.class}`} />
                    </div>
                    <div className="flex justify-between items-center text-[11px] mt-1">
                      <span className="text-[#565959]">Password strength:</span>
                      <span className={`font-semibold ${strength.textClass}`}>{strength.label}</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#0F1111] mb-1">
                  Re-enter password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-[34px] px-2.5 py-1 text-[14px] text-[#0F1111] bg-white border border-[#A6A6A6] rounded-[3px] focus:outline-none focus:border-[#E77600] focus:ring-3 focus:ring-[rgba(228,121,17,0.5)]"
                />
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  size="form"
                  fullWidth
                  disabled={isLoading}
                  type="submit"
                >
                  {isLoading ? 'Creating account...' : 'Continue'}
                </Button>
              </div>
            </form>

            <p className="text-[11px] text-[#565959] mt-4 leading-normal">
              By creating an account, you agree to ShopSphere's{' '}
              <Link to="#" className="text-[#007185] hover:underline">
                Conditions of Use
              </Link>{' '}
              and{' '}
              <Link to="#" className="text-[#007185] hover:underline">
                Privacy Notice
              </Link>
              .
            </p>

            <div className="pt-4 mt-4 border-t border-[#D5D9D9] text-[12px] text-[#0F1111]">
              Already have an account?{' '}
              <Link to="/login" className="text-[#007185] hover:text-[#C7511F] hover:underline font-medium">
                Sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
