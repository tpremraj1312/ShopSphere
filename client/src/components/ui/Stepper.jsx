import React from 'react';
import { Check } from 'lucide-react';

/**
 * Stepper component for Order Status tracking adhering to brief Section 8 & 13.
 * Uses --success green (#007600) for completed steps.
 */
export default function Stepper({
  steps = ['Ordered', 'Shipped', 'Out for delivery', 'Delivered'],
  currentStep = 0,
  className = '',
}) {
  return (
    <div className={`w-full py-4 ${className}`}>
      <div className="flex items-center justify-between relative">
        {/* Continuous connector line behind */}
        <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-[3px] bg-[#D5D9D9] -z-0" />
        <div
          className="absolute left-6 top-1/2 -translate-y-1/2 h-[3px] bg-[#007600] transition-all duration-300 -z-0"
          style={{
            width: `${(currentStep / Math.max(steps.length - 1, 1)) * 100}%`,
          }}
        />

        {steps.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isCurrent = idx === currentStep;

          return (
            <div
              key={step}
              className="flex flex-col items-center relative z-10 text-center"
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-semibold transition-colors ${
                  isCompleted
                    ? 'bg-[#007600] text-white'
                    : isCurrent
                    ? 'bg-[#007600] text-white ring-4 ring-[#007600]/20'
                    : 'bg-white border-2 border-[#D5D9D9] text-[#767676]'
                }`}
              >
                {isCompleted ? <Check size={14} strokeWidth={2.5} /> : idx + 1}
              </div>
              <span
                className={`mt-1.5 text-[12px] ${
                  isCompleted || isCurrent
                    ? 'font-medium text-[#0F1111]'
                    : 'text-[#767676]'
                }`}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
