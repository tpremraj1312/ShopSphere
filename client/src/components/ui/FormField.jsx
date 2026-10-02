import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * FormField wrapper adhering to Section 13 of the Design Brief:
 * - Clear 13px label in #0F1111 with optional required asterisk
 * - Error message display in #B12704 with AlertCircle icon
 * - Subtitle / helper text in #565959
 */
export default function FormField({
  label,
  error,
  helperText,
  required = false,
  id,
  children,
  className = '',
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="text-[13px] font-semibold text-[#0F1111] flex items-center justify-between"
        >
          <span>
            {label}
            {required && <span className="text-[#B12704] ml-0.5">*</span>}
          </span>
        </label>
      )}

      {children}

      {error ? (
        <div className="flex items-center gap-1.5 text-[12px] text-[#B12704] mt-0.5" role="alert">
          <AlertCircle size={13} strokeWidth={2} className="shrink-0" />
          <span>{error}</span>
        </div>
      ) : helperText ? (
        <p className="text-[12px] text-[#565959] mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
}
