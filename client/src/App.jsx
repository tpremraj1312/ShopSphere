import React, { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import SecondaryNav from './components/SecondaryNav';
import CategoryDrawer from './components/CategoryDrawer';
import Footer from './components/Footer';
import Home from './features/home/Home';
import Login from './features/auth/Login';
import Register from './features/auth/Register';
import VerifyEmail from './features/auth/VerifyEmail';
import ForgotPassword from './features/auth/ForgotPassword';
import ResetPassword from './features/auth/ResetPassword';
import Sessions from './features/auth/Sessions';
import Unauthorized from './features/auth/Unauthorized';
import ProtectedRoute from './components/ProtectedRoute';
import UiDemoPage from './features/ui-demo/UiDemoPage';

// Catalog & Seller features
import ProductList from './features/catalog/ProductList';
import ProductDetail from './features/catalog/ProductDetail';
import CategoryBrowse from './features/catalog/CategoryBrowse';
import ComparePage from './features/catalog/ComparePage';
import ShortUrlResolver from './features/catalog/ShortUrlResolver';
import CompareBar from './components/CompareBar';
import ProductManager from './features/seller/ProductManager';
import SellerDashboard from './features/seller/SellerDashboard';
import SellerOrders from './features/seller/SellerOrders';
import SellerShipping from './features/seller/SellerShipping';
import SellerAnalytics from './features/seller/SellerAnalytics';
import SellerReviews from './features/seller/SellerReviews';
import SellerSettings from './features/seller/SellerSettings';
import SellerOnboarding from './features/seller/SellerOnboarding';
import InventoryManager from './features/seller/InventoryManager';
import SellerLayout from './layouts/SellerLayout';

// Cart & Checkout
import CartPage from './features/cart/CartPage';

import CheckoutPage from './features/checkout/CheckoutPage';
import PaymentPage from './features/checkout/PaymentPage';
import OrderSuccessPage from './features/checkout/OrderSuccessPage';

// Orders
import OrderHistory from './features/orders/OrderHistory';
import OrderDetail from './features/orders/OrderDetail';

// Admin & Security features (Phase 4.1, ADM-FR-01 to 05, AUTH-FR-06)
import AdminLayout from './features/admin/AdminLayout';
import AdminDashboard from './features/admin/AdminDashboard';
import PlatformMetrics from './features/admin/PlatformMetrics';
import UserModeration from './features/admin/UserModeration';
import ListingModeration from './features/admin/ListingModeration';
import AuditLogViewer from './features/admin/AuditLogViewer';
import SecuritySettings from './features/admin/SecuritySettings';

function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-[#EAEDED] text-[#0F1111] flex flex-col font-sans">
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>

      {!isAdmin && (
        <>
          <Header />
          <SecondaryNav onMenuClick={() => setDrawerOpen(true)} />
          <CategoryDrawer
            isOpen={drawerOpen}
            onClose={() => setDrawerOpen(false)}
          />
        </>
      )}

      <main id="main-content" className="flex-1 w-full">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/_ui" element={<UiDemoPage />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/categories" element={<CategoryBrowse />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/s/:code" element={<ShortUrlResolver />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/cart" element={<CartPage />} />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Authenticated Customer routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/checkout/payment/:orderId" element={<PaymentPage />} />
            <Route path="/checkout/success/:orderId" element={<OrderSuccessPage />} />
            <Route path="/orders" element={<OrderHistory />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/security" element={<SecuritySettings />} />
          </Route>

          {/* Seller Onboarding — any authenticated user */}
          <Route element={<ProtectedRoute />}>
            <Route path="/seller/apply" element={<SellerOnboarding />} />
            <Route path="/sell" element={<SellerOnboarding />} />
          </Route>

          {/* Seller / Admin routes */}
          <Route element={<ProtectedRoute allowedRoles={['seller', 'admin', 'super_admin']} />}>
            <Route path="/seller" element={<SellerLayout />}>
              <Route index element={<SellerDashboard />} />
              <Route path="dashboard" element={<SellerDashboard />} />
              <Route path="products" element={<ProductManager />} />
              <Route path="inventory" element={<InventoryManager />} />
              <Route path="orders" element={<SellerOrders />} />
              <Route path="shipping" element={<SellerShipping />} />
              <Route path="analytics" element={<SellerAnalytics />} />
              <Route path="reviews" element={<SellerReviews />} />
              <Route path="settings" element={<SellerSettings />} />
            </Route>
          </Route>

          {/* Admin Command Center routes (Step 4.1.7) */}
          <Route element={<ProtectedRoute allowedRoles={['admin', 'super_admin']} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="metrics" element={<PlatformMetrics />} />
              <Route path="users" element={<UserModeration />} />
              <Route path="products" element={<ListingModeration />} />
              <Route path="audit" element={<AuditLogViewer />} />
              <Route path="security" element={<SecuritySettings />} />
            </Route>
          </Route>
        </Routes>
      </main>

      <CompareBar />
      {!isAdmin && <Footer />}
    </div>
  );
}

export default App;

