import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { X, ChevronRight, User } from 'lucide-react';
import { useGetCategoriesQuery } from '../store/productsApi';

/**
 * CategoryDrawer — 360px left slide-in drawer (Section 3.B, 15).
 * - Full Tailwind CSS with slide animation
 * - Dynamic user greeting (Hello, [Name] or Hello, Sign in)
 * - Keyboard accessible (ESC closes drawer)
 */
export default function CategoryDrawer({ isOpen, onClose }) {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { data: categoriesData, isLoading } = useGetCategoriesQuery();
  const categories = categoriesData?.data || [];

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Overlay Backdrop */}
      <div
        className={`fixed inset-0 bg-black/70 z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div
        className={`fixed top-0 left-0 w-[360px] max-w-[85vw] h-full bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="All categories navigation"
      >
        {/* Header */}
        <div className="bg-[#232F3E] text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#485769] flex items-center justify-center text-white shrink-0">
              <User size={18} strokeWidth={2} />
            </div>
            {isAuthenticated ? (
              <span className="text-[16px] font-bold text-white truncate max-w-[200px]">
                Hello, {user?.name || 'Customer'}
              </span>
            ) : (
              <Link
                to="/login"
                onClick={onClose}
                className="text-[16px] font-bold text-white hover:text-[#FFA41C] transition-colors"
              >
                Hello, Sign in
              </Link>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="text-white hover:text-[#FFA41C] p-1 rounded-[2px] transition-colors"
          >
            <X size={22} strokeWidth={2} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#D5D9D9] py-2">
          {/* Shop By Department */}
          <div className="py-2">
            <div className="text-[15px] font-bold text-[#0F1111] px-6 py-2">
              Shop By Department
            </div>

            {isLoading && (
              <div className="px-6 py-4 text-[13px] text-[#565959]">
                Loading departments...
              </div>
            )}

            {!isLoading && categories.length === 0 && (
              <div className="px-6 py-4 text-[13px] text-[#565959]">
                No categories found.
              </div>
            )}

            <ul className="divide-y divide-[#F0F2F2]">
              {categories.map((cat) => (
                <li key={cat.name}>
                  <Link
                    to={`/products?categoryL1=${encodeURIComponent(cat.name)}`}
                    onClick={onClose}
                    className="flex items-center justify-between px-6 py-3 text-[14px] text-[#0F1111] hover:bg-[#F0F2F2] transition-colors"
                  >
                    <span>{cat.name}</span>
                    <ChevronRight size={16} strokeWidth={1.75} className="text-[#767676]" />
                  </Link>

                  {/* Subcategories (L2) */}
                  {cat.subcategories?.length > 0 && (
                    <ul className="bg-[#FAFAFA] border-t border-[#F0F2F2] py-1">
                      {cat.subcategories.map((sub) => (
                        <li key={sub.name}>
                          <Link
                            to={`/products?categoryL1=${encodeURIComponent(
                              cat.name
                            )}&categoryL2=${encodeURIComponent(sub.name)}`}
                            onClick={onClose}
                            className="block px-9 py-2 text-[13px] text-[#565959] hover:text-[#0F1111] hover:bg-[#F0F2F2] transition-colors"
                          >
                            {sub.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Programs & Features */}
          <div className="py-2">
            <div className="text-[15px] font-bold text-[#0F1111] px-6 py-2">
              Programs & Features
            </div>
            <ul>
              <li>
                <Link
                  to="/products?sort=relevance"
                  onClick={onClose}
                  className="block px-6 py-2.5 text-[14px] text-[#0F1111] hover:bg-[#F0F2F2] transition-colors"
                >
                  Today's Deals
                </Link>
              </li>
              <li>
                <Link
                  to="/products?sort=rating"
                  onClick={onClose}
                  className="block px-6 py-2.5 text-[14px] text-[#0F1111] hover:bg-[#F0F2F2] transition-colors"
                >
                  Best Sellers
                </Link>
              </li>
              <li>
                <Link
                  to={['seller', 'admin', 'super_admin'].includes(user?.role) ? '/seller/dashboard' : '/seller/apply'}
                  onClick={onClose}
                  className="block px-6 py-2.5 text-[14px] text-[#0F1111] hover:bg-[#F0F2F2] transition-colors"
                >
                  Sell on ShopSphere
                </Link>
              </li>
            </ul>
          </div>

          {/* Help & Settings */}
          <div className="py-2">
            <div className="text-[15px] font-bold text-[#0F1111] px-6 py-2">
              Help & Settings
            </div>
            <ul>
              <li>
                <Link
                  to={isAuthenticated ? '/orders' : '/login'}
                  onClick={onClose}
                  className="block px-6 py-2.5 text-[14px] text-[#0F1111] hover:bg-[#F0F2F2] transition-colors"
                >
                  Your Account
                </Link>
              </li>
              <li>
                <Link
                  to="/orders"
                  onClick={onClose}
                  className="block px-6 py-2.5 text-[14px] text-[#0F1111] hover:bg-[#F0F2F2] transition-colors"
                >
                  Your Orders
                </Link>
              </li>
              {!isAuthenticated ? (
                <li>
                  <Link
                    to="/login"
                    onClick={onClose}
                    className="block px-6 py-2.5 text-[14px] text-[#0F1111] hover:bg-[#F0F2F2] transition-colors font-medium text-[#007185]"
                  >
                    Sign In
                  </Link>
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
