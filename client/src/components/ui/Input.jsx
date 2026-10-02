import React, { forwardRef } from 'react';

/**
 * Input component adhering to Design Brief Section 2.5:
 * - Height: 34px
 * - Border: 1px --border-strong (#A6A6A6), radius: 3px
 * - Focus: border #E77600 + box-shadow: 0 0 0 3px rgba(228,121,17,.5)
 */
export const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    id,
    type = 'text',
    className = '',
    style = {},
    required = false,
    ...props
  },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex flex-col gap-1 w-full text-left">
      {label && (
        <label
          htmlFor={inputId}
          className="text-[13px] font-medium text-[#0F1111] flex items-center gap-1"
        >
          {label}
          {required && <span className="text-[#B12704]">*</span>}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        type={type}
        required={required}
        className={`w-full h-[34px] px-2.5 py-1 text-[14px] text-[#0F1111] bg-white border ${
          error ? 'border-[#B12704]' : 'border-[#A6A6A6]'
        } rounded-[3px] placeholder:text-[#767676] transition-colors focus:outline-none focus:border-[#E77600] focus:ring-3 focus:ring-[rgba(228,121,17,0.5)] disabled:bg-[#F0F2F2] disabled:cursor-not-allowed ${className}`}
        style={style}
        {...props}
      />
      {error ? (
        <span className="text-[12px] text-[#B12704]">{error}</span>
      ) : helperText ? (
        <span className="text-[12px] text-[#565959]">{helperText}</span>
      ) : null}
    </div>
  );
});

export default Input;
