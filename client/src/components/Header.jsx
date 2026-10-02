import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { MapPin, Search, ShoppingCart, ChevronDown, User, LogOut } from 'lucide-react';
import { logout } from '../store/authSlice';
import { useLogoutUserMutation } from '../store/authApi';
import { useGetCartQuery } from '../store/cartApi';
import { useGetCategoriesQuery } from '../store/productsApi';
import NotificationBell from './NotificationBell';
import SearchSuggestions from './SearchSuggestions';
import AddressModal from './AddressModal';
import { useGetAddressesQuery } from '../store/orderApi';

/**
 * Header — Amazon-style marketplace header (Section 3.A, 15).
 * - Desktop: 60px sticky bar, bg #131921, high density
 * - Mobile (< 640px): 2-row layout (logo + account + cart on row 1, full-width search on row 2)
 * - 100% Tailwind utility classes (no inline style objects)
 * - 1px white border on hover for nav items
 */
export default function Header() {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [logoutUser] = useLogoutUserMutation();
  const { token } = useSelector((state) => state.auth);
  const { data: cartData } = useGetCartQuery(undefined, { skip: !token });
  const { data: categoriesData } = useGetCategoriesQuery();
  const departments = categoriesData?.data || [];
  const cartItemCount = cartData?.data?.items?.length || 0;

  const [accountOpen, setAccountOpen] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [searchCategory, setSearchCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const accountRef = useRef(null);
  const searchContainerRef = useRef(null);

  const { data: addressesData } = useGetAddressesQuery(undefined, { skip: !token });
  const addresses = addressesData?.data || [];
  const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0];
  const deliverToName = defaultAddress?.name?.split(' ')[0] || user?.name?.split(' ')[0] || 'Customer';
  const deliverToLocation = defaultAddress
    ? `${defaultAddress.city || defaultAddress.street}${defaultAddress.postalCode ? ' ' + defaultAddress.postalCode : ''}`
    : 'Add address';

  const handleLogout = async () => {
    try {
      await logoutUser().unwrap();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      dispatch(logout());
      navigate('/login');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setIsSearchFocused(false);
    const query = searchQuery.trim();
    const params = new URLSearchParams();
    if (query) params.append('search', query);
    if (searchCategory) params.append('categoryL1', searchCategory);
    navigate(`/products?${params.toString()}`);
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setAccountOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navItemClass =
    'flex items-center text-white border border-transparent hover:border-white rounded-[2px] p-1.5 transition-colors cursor-pointer select-none';

  return (
    <header className="sticky top-0 z-40 bg-[#131921] w-full text-white">
      {/* Main Header Container */}
      <div className="page-container py-2 sm:py-0 sm:h-[60px] flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        {/* Row 1 for Mobile / Desktop Left + Logo */}
        <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
          {/* Logo */}
          <Link
            to="/"
            id="header-logo"
            className="text-white text-[21px] sm:text-[22px] font-semibold tracking-tight border border-transparent hover:border-white px-2 py-1 rounded-[2px] whitespace-nowrap shrink-0 transition-colors"
          >
            ShopSphere
          </Link>

          {/* Deliver to (Desktop only in row 1) */}
          {isAuthenticated && (
            <button
              type="button"
              id="deliver-to-block"
              onClick={() => setAddressModalOpen(true)}
              className={`hidden md:flex items-center gap-1.5 ${navItemClass} shrink-0 text-left`}
              title="Click to view and add delivery addresses"
            >
              <MapPin size={16} strokeWidth={1.75} className="text-[#FFD814] shrink-0" />
              <div className="leading-tight text-left">
                <div className="text-[11px] text-[#CCCCCC] truncate max-w-[130px]">
                  Deliver to {deliverToName}
                </div>
                <div className="text-[13px] font-semibold text-white truncate max-w-[130px]">
                  {deliverToLocation}
                </div>
              </div>
            </button>
          )}

          {/* Mobile Right Quick Icons (Account, Notification, Cart) */}
          <div className="flex sm:hidden items-center gap-1">
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => setAddressModalOpen(true)}
                className="p-1.5 text-white flex items-center"
                aria-label="Delivery address"
                title="Delivery address"
              >
                <MapPin size={18} strokeWidth={1.75} className="text-[#FFD814]" />
              </button>
            )}
            {isAuthenticated && <NotificationBell />}
            <Link
              to="/cart"
              className="relative p-1.5 text-white flex items-center"
              aria-label={`Cart with ${cartItemCount} items`}
            >
              <ShoppingCart size={22} strokeWidth={1.75} />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#FFA41C] text-[#0F1111] text-[10px] font-bold min-w-[17px] h-[17px] rounded-full flex items-center justify-center leading-none">
                  {cartItemCount > 9 ? '9+' : cartItemCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Search Bar Container with real-time suggestions (Row 2 on mobile, flex-1 on desktop) */}
        <div ref={searchContainerRef} className="relative flex-1">
          <form
            onSubmit={handleSearch}
            id="header-search-form"
            className={`flex items-center h-[38px] sm:h-[40px] rounded-[4px] overflow-hidden bg-white transition-all ${
              isSearchFocused
                ? 'ring-2 ring-[#FF9900] border-transparent'
                : 'border border-transparent'
            }`}
          >
            {/* Category Dropdown */}
            <select
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
              className="h-full px-2 bg-[#E6E6E6] hover:bg-[#D4D4D4] border-r border-[#D5D9D9] text-[12px] text-[#0F1111] cursor-pointer outline-none shrink-0 max-w-[125px] sm:max-w-[140px] truncate"
              aria-label="Select search category"
            >
              <option value="">All</option>
              {departments.map((dept) => (
                <option key={dept.name} value={dept.name}>
                  {dept.name}
                </option>
              ))}
            </select>

            {/* Input field */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setIsSearchFocused(false);
              }}
              placeholder="Search ShopSphere"
              aria-label="Search ShopSphere"
              className="flex-1 h-full px-3 text-[14px] text-[#0F1111] bg-white outline-none min-w-0"
            />

            {/* Search Button */}
            <button
              type="submit"
              aria-label="Execute search"
              className="w-[45px] h-full bg-[#FEBD69] hover:bg-[#F3A847] text-[#0F1111] flex items-center justify-center cursor-pointer transition-colors shrink-0"
            >
              <Search size={19} strokeWidth={2} />
            </button>
          </form>

          {/* Real-time Suggestions Dropdown */}
          <SearchSuggestions
            isOpen={isSearchFocused}
            query={searchQuery}
            category={searchCategory}
            onSelectQuery={(q, cat) => {
              setSearchQuery(q);
              if (cat !== undefined) setSearchCategory(cat);
              setIsSearchFocused(false);
              const params = new URLSearchParams();
              if (q) params.append('search', q);
              if (cat || searchCategory) params.append('categoryL1', cat || searchCategory);
              navigate(`/products?${params.toString()}`);
            }}
            onClose={() => setIsSearchFocused(false)}
          />
        </div>

        {/* Desktop Right Nav (Account, Orders, Notifications, Cart) */}
        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
          {/* Account & Lists Block */}
          <div ref={accountRef} className="relative">
            <div
              id="account-block"
              onClick={() => setAccountOpen(!accountOpen)}
              className={navItemClass}
              role="button"
              aria-haspopup="true"
              aria-expanded={accountOpen}
            >
              <div className="leading-tight text-left">
                <div className="text-[11px] text-[#CCCCCC]">
                  Hello, {isAuthenticated ? (user?.name?.split(' ')[0] || user?.email?.split('@')[0]) : 'Sign in'}
                </div>
                <div className="text-[13px] font-semibold flex items-center gap-0.5">
                  Account & Lists <ChevronDown size={13} strokeWidth={2} />
                </div>
              </div>
            </div>

            {/* Account Dropdown */}
            {accountOpen && (
              <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-[#D5D9D9] rounded-[4px] shadow-lg z-50 p-4 text-[#0F1111]">
                {!isAuthenticated ? (
                  <div className="text-center">
                    <Link
                      to="/login"
                      onClick={() => setAccountOpen(false)}
                      className="block w-full py-2 bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] border border-[#FCD200] rounded-[3px] text-[13px] font-semibold mb-2.5 transition-colors"
                    >
                      Sign in
                    </Link>
                    <div className="text-[11px] text-[#565959]">
                      New customer?{' '}
                      <Link
                        to="/register"
                        onClick={() => setAccountOpen(false)}
                        className="text-[#007185] hover:text-[#C7511F] hover:underline"
                      >
                        Start here.
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="border-b border-[#D5D9D9] pb-2 mb-2">
                      <div className="text-[13px] font-semibold text-[#0F1111]">Your Account</div>
                    </div>
                    <div className="flex flex-col gap-1 text-[13px]">
                      <Link
                        to="/orders"
                        onClick={() => setAccountOpen(false)}
                        className="py-1 text-[#0F1111] hover:text-[#C7511F] hover:underline"
                      >
                        Your Orders
                      </Link>
                      <Link
                        to="/sessions"
                        onClick={() => setAccountOpen(false)}
                        className="py-1 text-[#0F1111] hover:text-[#C7511F] hover:underline"
                      >
                        Active Sessions
                      </Link>
                      <Link
                        to="/security"
                        onClick={() => setAccountOpen(false)}
                        className="py-1 text-[#0F1111] hover:text-[#C7511F] hover:underline"
                      >
                        Login & Security
                      </Link>
                      {(user?.role === 'seller' || user?.role === 'admin' || user?.role === 'super_admin') && (
                        <>
                          <div className="border-t border-[#E7E7E7] my-1" />
                          <Link
                            to="/seller/products"
                            onClick={() => setAccountOpen(false)}
                            className="py-1 text-[#0F1111] hover:text-[#C7511F] hover:underline"
                          >
                            Seller Dashboard
                          </Link>
                          <Link
                            to="/seller/orders"
                            onClick={() => setAccountOpen(false)}
                            className="py-1 text-[#0F1111] hover:text-[#C7511F] hover:underline"
                          >
                            Seller Fulfillment
                          </Link>
                        </>
                      )}
                      {['admin', 'super_admin'].includes(user?.role) && (
                        <Link
                          to="/admin"
                          onClick={() => setAccountOpen(false)}
                          className="py-1 text-[#0F1111] hover:text-[#C7511F] hover:underline"
                        >
                          Admin Panel
                        </Link>
                      )}
                    </div>
                    <div className="border-t border-[#D5D9D9] mt-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAccountOpen(false);
                          handleLogout();
                        }}
                        className="text-[13px] text-[#007185] hover:text-[#C7511F] hover:underline bg-transparent border-none cursor-pointer p-0 text-left flex items-center gap-1.5"
                      >
                        <LogOut size={14} /> Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Returns & Orders */}
          <Link
            to="/orders"
            id="returns-orders-link"
            className={`${navItemClass} leading-tight text-left`}
          >
            <div>
              <div className="text-[11px] text-[#CCCCCC]">Returns</div>
              <div className="text-[13px] font-semibold text-white">& Orders</div>
            </div>
          </Link>

          {/* Notifications */}
          {isAuthenticated && <NotificationBell />}

          {/* Cart */}
          <Link
            to="/cart"
            id="header-cart-link"
            className={`${navItemClass} flex items-end gap-1 relative px-2`}
            aria-label={`Shopping Cart with ${cartItemCount} items`}
          >
            <div className="relative">
              <ShoppingCart size={24} strokeWidth={1.75} />
              {cartItemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#FFA41C] text-[#0F1111] text-[11px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center leading-none border border-[#131921]">
                  {cartItemCount > 9 ? '9+' : cartItemCount}
                </span>
              )}
            </div>
            <span className="text-[13px] font-semibold hidden md:inline">Cart</span>
          </Link>
        </div>
      </div>

      {/* Address Selection & Management Modal */}
      <AddressModal
        isOpen={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
      />
    </header>
  );
}
