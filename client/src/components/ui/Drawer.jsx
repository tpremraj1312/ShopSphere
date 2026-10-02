import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Drawer component with 200ms slide-in transition, left/right positions.
 */
export default function Drawer({
  isOpen,
  onClose,
  title,
  children,
  position = 'left',
  width = 'max-w-md',
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

  const isLeft = position === 'left';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dim Overlay */}
      <div
        className="fixed inset-0 bg-black/60 transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={`fixed inset-y-0 ${
          isLeft ? 'left-0' : 'right-0'
        } flex max-w-full`}
      >
        <div
          role="dialog"
          aria-modal="true"
          className={`w-screen ${width} bg-white shadow-xl flex flex-col transition-transform duration-200 ease-out border-${
            isLeft ? 'r' : 'l'
          } border-[#D5D9D9] ${className}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#D5D9D9] bg-[#232F3E] text-white">
            <h2 className="text-[16px] font-semibold text-white truncate">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close panel"
              className="p-1 rounded-[3px] text-white/80 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
            >
              <X size={20} strokeWidth={1.75} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 text-[14px] text-[#0F1111]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
