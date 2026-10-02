import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Select component adhering to Design Brief Section 2.5:
 * - Height: 34px
 * - Border: 1px --border-strong (#A6A6A6), radius: 3px
 * - Focus: border #E77600 + box-shadow
 */
export const Select = forwardRef(function Select(
  {
    label,
    error,
    helperText,
    id,
    options = [],
    children,
    className = '',
    style = {},
    required = false,
    ...props
  },
  ref
) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex flex-col gap-1 w-full text-left">
      {label && (
        <label
          htmlFor={selectId}
          className="text-[13px] font-medium text-[#0F1111] flex items-center gap-1"
        >
          {label}
          {required && <span className="text-[#B12704]">*</span>}
        </label>
      )}
      <div className="relative w-full">
        <select
          ref={ref}
          id={selectId}
          required={required}
          className={`w-full h-[34px] pl-2.5 pr-8 py-1 text-[13px] text-[#0F1111] bg-[#F0F2F2] hover:bg-[#E3E6E6] border ${
            error ? 'border-[#B12704]' : 'border-[#D5D9D9]'
          } rounded-[3px] appearance-none cursor-pointer transition-colors focus:outline-none focus:border-[#E77600] focus:ring-3 focus:ring-[rgba(228,121,17,0.5)] disabled:bg-[#F0F2F2] disabled:cursor-not-allowed ${className}`}
          style={style}
          {...props}
        >
          {options.length > 0
            ? options.map((opt) => (
                <option key={opt.value ?? opt} value={opt.value ?? opt}>
                  {opt.label ?? opt}
                </option>
              ))
            : children}
        </select>
        <ChevronDown
          size={14}
          strokeWidth={1.75}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#565959]"
        />
      </div>
      {error ? (
        <span className="text-[12px] text-[#B12704]">{error}</span>
      ) : helperText ? (
        <span className="text-[12px] text-[#565959]">{helperText}</span>
      ) : null}
    </div>
  );
});

export default Select;
