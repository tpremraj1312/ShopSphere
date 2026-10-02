import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

/**
 * Toast notification component:
 * - Position: top-right
 * - Duration: 4s auto-dismiss
 * - Clean marketplace styling, no glow/floating blobs
 */
export default function Toast({
  message,
  type = 'info',
  onClose,
  duration = 4000,
}) {
  useEffect(() => {
    if (!duration) return;
    const timer = setTimeout(() => {
      onClose?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle2 size={18} strokeWidth={1.75} className="text-[#007600] shrink-0" />,
    error: <AlertCircle size={18} strokeWidth={1.75} className="text-[#B12704] shrink-0" />,
    info: <Info size={18} strokeWidth={1.75} className="text-[#007185] shrink-0" />,
  };

  const borders = {
    success: 'border-l-4 border-l-[#007600]',
    error: 'border-l-4 border-l-[#B12704]',
    info: 'border-l-4 border-l-[#007185]',
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-4 right-4 z-50 flex items-start gap-3 w-80 bg-white border border-[#D5D9D9] shadow-md p-3.5 rounded-[4px] text-[13px] text-[#0F1111] transition-all ${
        borders[type] || borders.info
      }`}
    >
      {icons[type] || icons.info}
      <div className="flex-1 leading-snug">{message}</div>
      <button
        onClick={onClose}
        aria-label="Close notification"
        className="text-[#565959] hover:text-[#0F1111] p-0.5 rounded-[2px] transition-colors"
      >
        <X size={15} strokeWidth={1.75} />
      </button>
    </div>
  );
}
