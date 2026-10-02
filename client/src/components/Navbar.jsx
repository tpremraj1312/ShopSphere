import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import { useLogoutUserMutation } from '../store/authApi';
import { useGetCartQuery } from '../store/cartApi';
import CartDrawer from '../features/cart/CartDrawer';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [logoutUser] = useLogoutUserMutation();
  const [cartOpen, setCartOpen] = useState(false);

  // Fetch cart to show badge count
  const { token } = useSelector((state) => state.auth);
  const { data: cartData } = useGetCartQuery(undefined, { skip: !token });
  const cartItemCount = cartData?.data?.items?.length || 0;

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

  return (
    <>
      <header className="sticky top-0 z-50 glass-panel border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-extrabold bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent tracking-tight">
              ShopSphere
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <Link to="/products" className="hover:text-white transition-colors">Catalog</Link>
              <Link to="/categories" className="hover:text-white transition-colors">Categories</Link>
              {isAuthenticated && (
                <>
                  <Link to="/orders" className="hover:text-white transition-colors">My Orders</Link>
                  <Link to="/sessions" className="hover:text-white transition-colors">Sessions</Link>
                  <Link to="/security" className="hover:text-white transition-colors">Security</Link>
                  {(user?.role === 'seller' || user?.role === 'admin' || user?.role === 'super_admin') && (
                    <div className="flex items-center gap-4">
                      <Link to="/seller/products" className="text-blue-400 hover:text-blue-300 transition-colors font-semibold">
                        Products
                      </Link>
                      <Link to="/seller/orders" className="text-indigo-400 hover:text-indigo-300 transition-colors font-semibold">
                        Fulfillment
                      </Link>
                    </div>
                  )}
                  {['admin', 'super_admin'].includes(user?.role) && (
                    <Link
                      to="/admin"
                      className="text-amber-400 hover:text-amber-300 transition-colors font-semibold flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30 text-xs shadow-sm"
                    >
                      🛡️ Admin Control
                    </Link>
                  )}
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification Bell (NOT-FR-02, Step 3.4.5) */}
            {isAuthenticated && <NotificationBell />}

            {/* Cart Icon */}
            <button
              id="cart-toggle-btn"
              onClick={() => setCartOpen(true)}
              className="relative p-2 text-slate-300 hover:text-white transition-colors group"
              aria-label="Open cart"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartItemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 min-w-[18px] flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-[10px] font-bold rounded-full shadow-lg shadow-blue-500/30 animate-scaleIn">
                  {cartItemCount > 9 ? '9+' : cartItemCount}
                </span>
              )}
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-white">{user?.email}</span>
                  <span className="text-[10px] text-blue-400 capitalize">{user?.role || 'Customer'}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-lg shadow-sm shadow-blue-500/20 transition-all"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Cart Drawer (global) */}
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
};

export default Navbar;
