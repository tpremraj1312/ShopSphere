import React from 'react';

/**
 * Tabs component adhering to marketplace standards:
 * - Simple horizontal border-b tab strip
 * - Active tab: border-b-2 border-[#E77600], font-semibold, text-[#0F1111]
 */
export default function Tabs({
  tabs = [],
  activeTab,
  onChange,
  className = '',
}) {
  return (
    <div className={`flex border-b border-[#D5D9D9] overflow-x-auto ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`px-4 py-2.5 text-[14px] whitespace-nowrap transition-colors border-b-2 -mb-[1px] ${
              isActive
                ? 'border-[#E77600] font-semibold text-[#0F1111]'
                : 'border-transparent text-[#565959] hover:text-[#0F1111]'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1.5 text-[12px] text-[#767676]">
                ({tab.count})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
