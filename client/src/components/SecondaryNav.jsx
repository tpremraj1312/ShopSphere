import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Menu } from 'lucide-react';

/**
 * SecondaryNav — 40px sub-navigation bar, bg #232F3E (Section 3.B, 15).
 * - Full Tailwind styling (no inline style objects)
 * - Mobile responsive horizontal scrolling
 * - 1px white border on hover
 */
export default function SecondaryNav({ onMenuClick }) {
  const user = useSelector((state) => state.auth.user);
  const sellerLink = ['seller', 'admin', 'super_admin'].includes(user?.role)
    ? '/seller/dashboard'
    : '/seller/apply';
  const links = [
    { label: "Today's Deals", to: '/products?sort=relevance' },
    { label: 'Best Sellers', to: '/products?sort=rating' },
    { label: 'New Releases', to: '/products?sort=newest' },
    { label: 'Customer Service', to: '#' },
    { label: 'Sell on ShopSphere', to: sellerLink },
  ];

  return (
    <nav
      className="bg-[#232F3E] text-white h-[38px] sm:h-[40px] flex items-center shadow-inner overflow-hidden"
      aria-label="Secondary navigation"
    >
      <div className="page-container flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-1">
        {/* All categories hamburger */}
        <button
          type="button"
          onClick={onMenuClick}
          id="all-categories-btn"
          className="flex items-center gap-1 text-white text-[13px] sm:text-[14px] font-semibold px-2 py-1 border border-transparent hover:border-white rounded-[2px] cursor-pointer whitespace-nowrap shrink-0 transition-colors"
          aria-label="Open all categories menu"
        >
          <Menu size={18} strokeWidth={2} />
          <span>All</span>
        </button>

        {/* Horizontal Links */}
        {links.map((link) => (
          <Link
            key={link.label}
            to={link.to}
            className="text-white text-[13px] sm:text-[14px] font-normal px-2 py-1 border border-transparent hover:border-white rounded-[2px] whitespace-nowrap shrink-0 transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
