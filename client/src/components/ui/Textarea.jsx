import React, { forwardRef } from 'react';

/**
 * Textarea component adhering to Amazon/ShopSphere design tokens:
 * - 3px border-radius, border #A6A6A6
 * - Focus ring: border #E77600 with warm amber glow
 * - 14px font size, line-height 1.4
 */
export const Textarea = forwardRef(function Textarea(
  {
    label,
    error,
    helperText,
    id,
    rows = 4,
    className = '',
    required = false,
    disabled = false,
    ...props
  },
  ref
) {
  const textareaId = id || (label ? `txt-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label
          htmlFor={textareaId}
          className="text-[13px] font-semibold text-[#0F1111]"
        >
          {label}
          {required && <span className="text-[#B12704] ml-0.5">*</span>}
        </label>
      )}

      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        disabled={disabled}
        required={required}
        aria-invalid={error ? 'true' : 'false'}
        className={`w-full p-2.5 text-[14px] text-[#0F1111] bg-white border rounded-[3px] placeholder:text-[#767676] transition-colors resize-y ${
          error
            ? 'border-[#B12704] focus:border-[#B12704] focus:ring-2 focus:ring-[#B12704]/30'
            : 'border-[#A6A6A6] hover:border-[#767676] focus:border-[#E77600] focus:ring-2 focus:ring-[rgba(228,121,17,0.4)]'
        } ${disabled ? 'bg-[#F0F2F2] cursor-not-allowed text-[#767676]' : ''} ${className}`}
        {...props}
      />

      {error ? (
        <p className="text-[12px] text-[#B12704] mt-0.5" role="alert">
          {error}
        </p>
      ) : helperText ? (
        <p className="text-[12px] text-[#565959] mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
});

export default Textarea;
