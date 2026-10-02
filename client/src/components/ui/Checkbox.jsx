import React, { forwardRef } from 'react';
import { Check } from 'lucide-react';

/**
 * Checkbox component adhering to Amazon-style facets and form controls.
 */
export const Checkbox = forwardRef(function Checkbox(
  {
    label,
    checked,
    onChange,
    id,
    disabled = false,
    className = '',
    count,
    ...props
  },
  ref
) {
  const checkboxId = id || (label ? `chk-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <label
      htmlFor={checkboxId}
      className={`inline-flex items-center gap-2 text-[13px] text-[#0F1111] cursor-pointer select-none ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:text-[#C7511F]'
      } ${className}`}
    >
      <span className="relative flex items-center justify-center">
        <input
          ref={ref}
          type="checkbox"
          id={checkboxId}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          aria-checked={checked}
          className="peer sr-only"
          {...props}
        />
        <span className="w-4 h-4 rounded-[2px] border border-[#A6A6A6] bg-white transition-colors peer-checked:bg-[#007185] peer-checked:border-[#007185] peer-focus-visible:ring-2 peer-focus-visible:ring-[#007185] peer-focus-visible:ring-offset-1 flex items-center justify-center">
          <Check
            size={12}
            strokeWidth={2.5}
            className="text-white opacity-0 peer-checked:opacity-100 transition-opacity"
          />
        </span>
      </span>
      {label && <span className="leading-tight">{label}</span>}
      {count !== undefined && (
        <span className="text-[12px] text-[#565959]">({count})</span>
      )}
    </label>
  );
});

export default Checkbox;
