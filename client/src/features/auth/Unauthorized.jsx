import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import Button from '../../components/ui/Button';

export default function Unauthorized() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-[#EAEDED] py-12 px-4">
      <div className="w-full max-w-md p-8 rounded-[4px] bg-white border border-[#D5D9D9] shadow-sm text-center">
        <div className="w-14 h-14 rounded-full bg-[#FFF0F0] border border-[#B12704]/20 text-[#B12704] flex items-center justify-center mx-auto mb-4">
          <ShieldAlert size={28} strokeWidth={2} />
        </div>
        <h1 className="text-[22px] font-semibold text-[#0F1111] mb-2">
          Access Denied
        </h1>
        <p className="text-[#565959] text-[13px] mb-6 leading-relaxed">
          You do not have the required permissions or role to view this page. If you believe this is an error, please contact customer support or return home.
        </p>
        <Link to="/" className="inline-block w-full">
          <Button variant="primary" size="form" fullWidth>
            Return to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
