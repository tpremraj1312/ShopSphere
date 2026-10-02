import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import Button from '../../components/ui/Button';
import Price from '../../components/ui/Price';

/**
 * CategoryGridCard adhering to Section 4.2:
 * - White surface, 2px radius, padding 20px, ~420px tall
 * - 20px weight-600 title
 * - Bottom 13px --link "See more" or "Shop now"
 * - No emojis, flat utilitarian aesthetic
 */
export default function CategoryGridCard({
  type = '2x2', // '2x2' | 'single' | 'signin' | 'deals'
  title,
  linkText = 'See more',
  linkTo = '/products',
  items = [],
  singleImage,
  singleSubtitle,
  user,
}) {
  return (
    <div className="bg-white border border-[#D5D9D9] rounded-[2px] p-5 flex flex-col justify-between h-[420px]">
      <div>
        <h2 className="text-[20px] font-semibold text-[#0F1111] leading-snug line-clamp-2 mb-3">
          {title}
        </h2>

        {/* 2x2 Layout */}
        {type === '2x2' && (
          <div className="grid grid-cols-2 gap-3">
            {items.slice(0, 4).map((item, idx) => (
              <Link
                key={idx}
                to={item.to || linkTo}
                className="group flex flex-col gap-1 text-left"
              >
                <div className="w-full h-[115px] bg-[#F0F2F2] rounded-[2px] overflow-hidden flex items-center justify-center p-1">
                  <img
                    src={item.image}
                    alt={item.label}
                    className="max-h-full max-w-full object-contain group-hover:opacity-90 transition-opacity"
                    loading="lazy"
                  />
                </div>
                <span className="text-[12px] text-[#0F1111] group-hover:text-[#C7511F] group-hover:underline line-clamp-1">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        )}

        {/* Single Image Layout */}
        {type === 'single' && (
          <Link to={linkTo} className="group block">
            <div className="w-full h-[260px] bg-[#F0F2F2] rounded-[2px] overflow-hidden flex items-center justify-center p-2 mb-2">
              <img
                src={singleImage}
                alt={title}
                className="max-h-full max-w-full object-cover group-hover:opacity-95 transition-opacity"
                loading="lazy"
              />
            </div>
            {singleSubtitle && (
              <span className="text-[13px] text-[#565959] group-hover:text-[#0F1111] line-clamp-1">
                {singleSubtitle}
              </span>
            )}
          </Link>
        )}

        {/* Sign-in Card (Guests Only) */}
        {type === 'signin' && (
          <div className="flex flex-col items-center justify-center text-center py-6">
            <div className="w-14 h-14 rounded-[4px] bg-[#F0F2F2] border border-[#D5D9D9] flex items-center justify-center mb-4 text-[#232F3E]">
              <ShoppingBag size={26} strokeWidth={1.75} />
            </div>
            <p className="text-[14px] text-[#0F1111] mb-5">
              Sign in for personalized recommendations, order tracking, and faster checkout.
            </p>
            <Link to="/login" className="w-full mb-3">
              <Button variant="primary" size="form" fullWidth>
                Sign in securely
              </Button>
            </Link>
            <div className="text-[12px] text-[#565959]">
              New customer?{' '}
              <Link to="/register" className="text-[#007185] hover:text-[#C7511F] hover:underline font-medium">
                Start here
              </Link>
            </div>
          </div>
        )}

        {/* Deals Card */}
        {type === 'deals' && (
          <div className="flex flex-col gap-3">
            {items.slice(0, 3).map((item, idx) => (
              <Link
                key={idx}
                to={item.to || linkTo}
                className="group flex items-center gap-3 p-1.5 hover:bg-[#F7FAFA] rounded-[2px] transition-colors"
              >
                <div className="w-16 h-16 bg-[#F0F2F2] rounded-[2px] overflow-hidden shrink-0 flex items-center justify-center p-1">
                  <img
                    src={item.image}
                    alt={item.label}
                    className="max-h-full max-w-full object-contain"
                    loading="lazy"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 bg-[#CC0C39] text-white text-[11px] font-semibold rounded-[2px]">
                      {item.discount || '25% off'}
                    </span>
                    <span className="text-[11px] text-[#B12704] font-medium">Limited Deal</span>
                  </div>
                  <div className="text-[13px] text-[#0F1111] group-hover:text-[#C7511F] truncate mt-1">
                    {item.label}
                  </div>
                  <div className="mt-0.5">
                    <Price amount={item.price || 19.99} size="sm" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {type !== 'signin' && (
        <div className="pt-3 border-t border-transparent">
          <Link
            to={linkTo}
            className="text-[13px] text-[#007185] hover:text-[#C7511F] hover:underline font-medium inline-block"
          >
            {linkText}
          </Link>
        </div>
      )}
    </div>
  );
}
