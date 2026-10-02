import React, { useState } from 'react';

/**
 * Tooltip component adhering to Section 13 of the Design Brief.
 * - Flat, dark utilitarian container (#131921)
 * - 12px font, white text, 3px border-radius
 * - Supports positions: 'top' | 'bottom' | 'left' | 'right'
 * - Fully keyboard focusable and accessible
 */
export default function Tooltip({
  children,
  content,
  position = 'top',
  className = '',
}) {
  const [isVisible, setIsVisible] = useState(false);

  if (!content) return children;

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
    left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
    right: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
  };

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          role="tooltip"
          className={`absolute z-50 px-2.5 py-1.5 bg-[#131921] text-white text-[12px] leading-tight rounded-[3px] shadow-md whitespace-nowrap pointer-events-none transition-opacity duration-150 animate-fadeIn ${
            positionClasses[position] || positionClasses.top
          }`}
        >
          {content}
        </div>
      )}
    </div>
  );
}
