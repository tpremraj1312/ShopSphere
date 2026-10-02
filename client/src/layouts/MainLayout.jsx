import React, { useState } from 'react';
import Header from '../components/Header';
import SecondaryNav from '../components/SecondaryNav';
import CategoryDrawer from '../components/CategoryDrawer';
import Footer from '../components/Footer';

/**
 * Main customer layout shell adhering to Section 3.
 * Includes Header (#131921), SecondaryNav (#232F3E), CategoryDrawer, and Footer.
 */
export default function MainLayout({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#EAEDED] text-[#0F1111] antialiased">
      {/* Skip to main content accessibility link */}
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>

      {/* Header (sticky, 60px) */}
      <Header />

      {/* Secondary Navigation (40px) */}
      <SecondaryNav onMenuClick={() => setDrawerOpen(true)} />

      {/* Category Drawer (360px left slide-in) */}
      <CategoryDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      {/* Main page content */}
      <main id="main-content" className="flex-1 w-full focus:outline-none">
        {children}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
