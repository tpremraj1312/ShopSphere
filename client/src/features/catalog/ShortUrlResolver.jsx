import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function ShortUrlResolver() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!code) {
      navigate('/', { replace: true });
      return;
    }

    fetch(`/api/v1/share/${code}`, {
      headers: {
        Accept: 'application/json',
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Short link not found');
        return res.json();
      })
      .then((data) => {
        const target = data?.data?.originalUrl || data?.originalUrl;
        if (target) {
          try {
            const urlObj = new URL(target, window.location.origin);
            navigate(urlObj.pathname + urlObj.search, { replace: true });
          } catch (e) {
            window.location.href = target;
          }
        } else {
          navigate('/', { replace: true });
        }
      })
      .catch(() => {
        setError(true);
      });
  }, [code, navigate]);

  if (error) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 text-center bg-white border border-[#D5D9D9] rounded-[4px] shadow-sm">
        <h2 className="text-[18px] font-bold text-[#0F1111]">Link Expired or Not Found</h2>
        <p className="text-[13px] text-[#565959] mt-2 mb-4">
          This short link may have expired or is invalid.
        </p>
        <button
          onClick={() => navigate('/')}
          className="text-[13px] text-[#007185] hover:underline"
        >
          Return to ShopSphere Home
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
      <div className="w-8 h-8 border-3 border-[#007185] border-t-transparent rounded-full animate-spin mb-3" />
      <p className="text-[14px] text-[#0F1111] font-medium">Redirecting to product...</p>
    </div>
  );
}
