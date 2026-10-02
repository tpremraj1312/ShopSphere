import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

/**
 * Footer — Back-to-top bar + responsive 4-column links + bottom strip (Section 3.C, 15).
 * - 100% Tailwind styling
 * - Responsive grid collapse (4-col desktop -> 2-col tablet -> 1-col mobile)
 */
export default function Footer() {
  const user = useSelector((state) => state.auth.user);
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const columns = [
    {
      title: 'Get to Know Us',
      links: [
        { label: 'About ShopSphere', to: '#' },
        { label: 'Careers', to: '#' },
        { label: 'Press Releases', to: '#' },
        { label: 'ShopSphere Science', to: '#' },
      ],
    },
    {
      title: 'Make Money with Us',
      links: [
        { label: 'Sell on ShopSphere', to: ['seller', 'admin', 'super_admin'].includes(user?.role) ? '/seller/dashboard' : '/seller/apply' },
        { label: 'Seller Dashboard', to: '/seller/products' },
        { label: 'Seller Fulfillment', to: '/seller/orders' },
        { label: 'Become an Affiliate', to: '#' },
      ],
    },
    {
      title: 'Payment Products',
      links: [
        { label: 'ShopSphere Rewards', to: '#' },
        { label: 'Shop with Points', to: '#' },
        { label: 'Reload Your Balance', to: '#' },
        { label: 'ShopSphere Currency Converter', to: '#' },
      ],
    },
    {
      title: 'Let Us Help You',
      links: [
        { label: 'Your Account', to: '/orders' },
        { label: 'Your Orders', to: '/orders' },
        { label: 'Shipping Rates & Policies', to: '#' },
        { label: 'Returns & Replacements', to: '#' },
        { label: 'Customer Service & Help', to: '#' },
      ],
    },
  ];

  return (
    <footer className="w-full text-white">
      {/* Back to Top */}
      <button
        type="button"
        onClick={scrollToTop}
        className="w-full bg-[#37475A] hover:bg-[#485769] text-white text-[13px] py-3.5 text-center transition-colors cursor-pointer block border-none font-normal"
        aria-label="Back to top of page"
      >
        Back to top
      </button>

      {/* Main Footer Links */}
      <div className="bg-[#232F3E] py-10 border-b border-[#3a4553]">
        <div className="page-container grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-[14px] font-bold text-white mb-3">
                {col.title}
              </h4>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-[13px] text-[#DDDDDD] hover:text-white hover:underline transition-colors block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Legal Strip */}
      <div className="bg-[#131921] py-8 text-center text-[12px] text-[#999999]">
        <div className="page-container flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 flex-wrap">
          <Link
            to="/"
            className="text-white text-[16px] font-bold tracking-tight hover:underline"
          >
            ShopSphere
          </Link>
          <span>&copy; {new Date().getFullYear()} ShopSphere, Inc. or its affiliates</span>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <Link to="#" className="hover:text-white hover:underline">
              Conditions of Use
            </Link>
            <Link to="#" className="hover:text-white hover:underline">
              Privacy Notice
            </Link>
            <Link to="#" className="hover:text-white hover:underline">
              Your Ads Privacy Choices
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
