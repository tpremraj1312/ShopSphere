import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Modal component with 200ms fade + slide, accessible backdrop & escape handling.
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
  className = '',
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        className={`relative z-10 w-full ${maxWidth} bg-white rounded-[6px] border border-[#D5D9D9] shadow-md transition-all duration-200 flex flex-col max-h-[90vh] ${className}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#D5D9D9] bg-[#F0F2F2] rounded-t-[5px]">
          {title && (
            <h2 id="modal-title" className="text-[16px] font-semibold text-[#0F1111]">
              {title}
            </h2>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-[3px] text-[#565959] hover:text-[#0F1111] hover:bg-[#E3E6E6] transition-colors ml-auto focus:outline-none focus:ring-2 focus:ring-[#007185]"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 text-[14px] text-[#0F1111]">
          {children}
        </div>
      </div>
    </div>
  );
}
