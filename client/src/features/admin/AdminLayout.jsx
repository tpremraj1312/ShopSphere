import React from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  LayoutDashboard,
  BarChart3,
  Users,
  Tag,
  ScrollText,
  ShieldCheck,
  ArrowLeft,
  Shield,
} from 'lucide-react';

/**
 * AdminLayout — Clean Amazon Seller Central / AWS Console inspired admin shell.
 * Strict rules: No emoji, #232F3E sidebar, lucide-react only (1.75 stroke).
 */
export default function AdminLayout() {
  const { user } = useSelector((state) => state.auth);

  const navItems = [
    { label: 'Overview', to: '/admin', end: true, icon: LayoutDashboard },
    { label: 'Platform Metrics', to: '/admin/metrics', icon: BarChart3 },
    { label: 'User Governance', to: '/admin/users', icon: Users },
    { label: 'Listing Moderation', to: '/admin/products', icon: Tag },
    { label: 'Audit Trail', to: '/admin/audit', icon: ScrollText },
    { label: '2FA & Security', to: '/admin/security', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-[#EAEDED] text-[#0F1111] flex flex-col md:flex-row font-sans">
      {/* Admin Sidebar (#232F3E, 240px) */}
      <aside className="w-full md:w-60 bg-[#232F3E] text-white flex flex-col shrink-0 border-r border-[#131921]">
        {/* Brand Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-white hover:text-white/80">
            <span className="text-[18px] font-semibold tracking-tight">ShopSphere</span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-[2px] bg-[#E77600] text-white font-bold">
              Admin
            </span>
          </Link>
        </div>

        {/* User Info Strip */}
        <div className="px-4 py-3 bg-[#131921] border-b border-white/10 text-[12px]">
          <div className="text-white/70">Signed in as:</div>
          <div className="font-semibold text-white truncate">{user?.name || user?.email}</div>
          <div className="text-[#FFA41C] text-[11px] uppercase font-mono mt-0.5">{user?.role}</div>
        </div>

        {/* Navigation Links */}
        <nav className="p-2 flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-[3px] text-[13px] font-medium transition-colors ${
                    isActive
                      ? 'bg-white/15 text-white font-semibold border-l-3 border-[#E77600]'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                <Icon size={16} strokeWidth={1.75} className="shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Back to Marketplace */}
        <div className="p-3 border-t border-white/10">
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 rounded-[3px] text-[12px] text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={14} strokeWidth={2} />
            <span>Return to Storefront</span>
          </Link>
        </div>
      </aside>

      {/* Main Admin Content */}
      <main className="flex-1 p-6 overflow-y-auto max-w-7xl">
        <Outlet />
      </main>
    </div>
  );
}
