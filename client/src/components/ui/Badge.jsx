import React from 'react';

/**
 * Badge component for product tags, stock states, and status indicators.
 * Strict Amazon-style badges: no gradients, no pills (except tiny chips).
 */
export default function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
}) {
  const variantStyles = {
    deal: 'bg-[#CC0C39] text-white font-semibold',
    bestSeller: 'bg-[#E67A00] text-white font-medium',
    choice: 'bg-[#232F3E] text-white font-medium',
    inStock: 'bg-[#F0F8F0] text-[#007600] border border-[#007600]/30',
    lowStock: 'bg-[#FFF0F0] text-[#B12704] border border-[#B12704]/30',
    neutral: 'bg-[#F0F2F2] text-[#0F1111] border border-[#D5D9D9]',
    primary: 'bg-[#FFD814] text-[#0F1111] font-medium border border-[#FCD200]',
    info: 'bg-[#EBF8FA] text-[#007185] border border-[#007185]/30',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-1.5 py-0.5 rounded-[2px]',
    md: 'text-[12px] px-2 py-0.5 rounded-[3px]',
    lg: 'text-[13px] px-2.5 py-1 rounded-[3px]',
  };

  return (
    <span
      className={`inline-flex items-center justify-center tracking-tight leading-none ${
        variantStyles[variant] || variantStyles.neutral
      } ${sizeStyles[size] || sizeStyles.md} ${className}`}
    >
      {children}
    </span>
  );
}
