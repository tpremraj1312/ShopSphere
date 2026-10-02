import React, { useState } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingCart,
  Truck,
  TrendingUp,
  Star,
  Settings,
  ArrowLeft,
  Menu,
  X,
  Bell,
  ChevronRight,
  Store,
} from 'lucide-react';

const NAV_SECTIONS = [
  {
    items: [
      { label: 'Dashboard', to: '/seller/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'CATALOG',
    items: [
      { label: 'Products', to: '/seller/products', icon: Package },
      { label: 'Inventory', to: '/seller/inventory', icon: Warehouse },
    ],
  },
  {
    title: 'ORDERS',
    items: [
      { label: 'Manage Orders', to: '/seller/orders', icon: ShoppingCart },
      { label: 'Shipping', to: '/seller/shipping', icon: Truck },
    ],
  },
  {
    title: 'PERFORMANCE',
    items: [
      { label: 'Analytics & Sales', to: '/seller/analytics', icon: TrendingUp },
      { label: 'Reviews & Feedback', to: '/seller/reviews', icon: Star },
    ],
  },
  {
    title: 'SETTINGS',
    items: [
      { label: 'Account Settings', to: '/seller/settings', icon: Settings },
    ],
  },
];

/* Breadcrumb label map */
const CRUMB_LABELS = {
  seller: 'Seller Central',
  dashboard: 'Dashboard',
  products: 'Products',
  inventory: 'Inventory',
  orders: 'Orders',
  shipping: 'Shipping',
  analytics: 'Analytics',
  reviews: 'Reviews',
  settings: 'Settings',
};

function SidebarLink({ item, onClick }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.to === '/seller/dashboard'}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-[4px] text-[13px] font-medium transition-all duration-150 group ${
          isActive
            ? 'bg-[#37475A] text-white border-l-[3px] border-[#FFD814] pl-[9px]'
            : 'text-[#D5D9D9] hover:text-white hover:bg-[#37475A]/60'
        }`
      }
    >
      <Icon size={16} strokeWidth={1.75} className="shrink-0" />
      <span>{item.label}</span>
    </NavLink>
  );
}

/**
 * SellerLayout — Amazon Seller Central inspired layout.
 * Full sidebar with grouped navigation, collapsible on mobile.
 */
export default function SellerLayout() {
  const { user } = useSelector((state) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  /* Build breadcrumbs from pathname */
  const segments = location.pathname.split('/').filter(Boolean);
  const breadcrumbs = segments.map((seg, i) => ({
    label: CRUMB_LABELS[seg] || seg,
    to: '/' + segments.slice(0, i + 1).join('/'),
    isLast: i === segments.length - 1,
  }));

  const closeMobile = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-[#EAEDED] text-[#0F1111] flex font-sans">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-[240px] bg-[#232F3E] text-white flex flex-col shrink-0 transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <Link to="/seller/dashboard" className="flex items-center gap-2 text-white hover:text-white/90 transition-colors">
            <Store size={20} strokeWidth={1.75} className="text-[#FFD814]" />
            <span className="text-[17px] font-semibold tracking-tight">ShopSphere</span>
            <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded-[2px] bg-[#007185] text-white font-bold">
              Seller
            </span>
          </Link>
          <button
            onClick={closeMobile}
            className="md:hidden p-1 text-white/70 hover:text-white rounded"
          >
            <X size={18} />
          </button>
        </div>

        {/* Seller Info */}
        <div className="px-4 py-3 bg-[#131A22] border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#37475A] flex items-center justify-center text-[13px] font-bold text-[#FFD814] shrink-0">
              {(user?.name || user?.email || 'S')[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[12px] text-white/60">Store Account</div>
              <div className="text-[13px] font-semibold text-white truncate">
                {user?.name || user?.email}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#007600]" />
                <span className="text-[10px] text-[#007600] font-medium">Active Seller</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-1 scrollbar-thin">
          {NAV_SECTIONS.map((section, sIdx) => (
            <div key={sIdx}>
              {section.title && (
                <div className="px-3 pt-4 pb-1.5 text-[10px] font-bold text-white/40 uppercase tracking-wider">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => (
                <SidebarLink key={item.to} item={item} onClick={closeMobile} />
              ))}
            </div>
          ))}
        </nav>

        {/* Return to Store */}
        <div className="p-3 border-t border-white/10">
          <Link
            to="/"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-[4px] text-[12px] text-white/60 hover:text-white hover:bg-[#37475A]/60 transition-colors"
          >
            <ArrowLeft size={14} strokeWidth={2} />
            <span>Customer Storefront</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-[#D5D9D9] px-4 md:px-6 h-[52px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-1.5 text-[#565959] hover:text-[#0F1111] hover:bg-[#F0F2F2] rounded-[3px]"
            >
              <Menu size={20} />
            </button>

            {/* Breadcrumbs */}
            <nav className="hidden sm:flex items-center text-[12px] text-[#565959]">
              {breadcrumbs.map((crumb, i) => (
                <React.Fragment key={crumb.to}>
                  {i > 0 && <ChevronRight size={12} className="mx-1 text-[#D5D9D9]" />}
                  {crumb.isLast ? (
                    <span className="text-[#0F1111] font-medium">{crumb.label}</span>
                  ) : (
                    <Link to={crumb.to} className="hover:text-[#007185] hover:underline">
                      {crumb.label}
                    </Link>
                  )}
                </React.Fragment>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 text-[#565959] hover:text-[#0F1111] hover:bg-[#F0F2F2] rounded-[3px] relative">
              <Bell size={18} strokeWidth={1.75} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#CC0C39] rounded-full" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
