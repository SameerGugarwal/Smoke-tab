import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';

import { Suspense, lazy } from 'react';

// Auth
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));

// Vendor
const VendorDashboard = lazy(() => import('./pages/vendor/VendorDashboard'));
const CustomerTab = lazy(() => import('./pages/vendor/CustomerTab'));
const InventoryManager = lazy(() => import('./pages/vendor/InventoryManager'));
const VendorAnalytics = lazy(() => import('./pages/vendor/VendorAnalytics'));
const VendorQR = lazy(() => import('./pages/vendor/VendorQR'));
const VendorUPI = lazy(() => import('./pages/vendor/VendorUPI'));
const VendorPayments = lazy(() => import('./pages/vendor/VendorPayments'));

// Buyer
const BuyerDashboard = lazy(() => import('./pages/buyer/BuyerDashboard'));
const TabDetail = lazy(() => import('./pages/buyer/TabDetail'));
const ConsumptionPage = lazy(() => import('./pages/buyer/ConsumptionPage'));
const LimitsPage = lazy(() => import('./pages/buyer/LimitsPage'));
const BuyerPayments = lazy(() => import('./pages/buyer/BuyerPayments'));

// Common
const ScanPage = lazy(() => import('./pages/common/ScanPage'));
const NotFoundPage = lazy(() => import('./pages/common/NotFoundPage'));

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner fullPage />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'vendor' ? '/vendor' : '/buyer'} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<LoadingSpinner fullPage />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<RootRedirect />} />

            {/* Vendor */}
            <Route path="/vendor" element={<ProtectedRoute role="vendor"><Layout><VendorDashboard /></Layout></ProtectedRoute>} />
            <Route path="/vendor/customer/:tabId" element={<ProtectedRoute role="vendor"><Layout><CustomerTab /></Layout></ProtectedRoute>} />
            <Route path="/vendor/inventory" element={<ProtectedRoute role="vendor"><Layout><InventoryManager /></Layout></ProtectedRoute>} />
            <Route path="/vendor/analytics" element={<ProtectedRoute role="vendor"><Layout><VendorAnalytics /></Layout></ProtectedRoute>} />
            <Route path="/vendor/qr" element={<ProtectedRoute role="vendor"><Layout><VendorQR /></Layout></ProtectedRoute>} />
            <Route path="/vendor/upi" element={<ProtectedRoute role="vendor"><Layout><VendorUPI /></Layout></ProtectedRoute>} />
            <Route path="/vendor/payments" element={<ProtectedRoute role="vendor"><Layout><VendorPayments /></Layout></ProtectedRoute>} />

            {/* Buyer */}
            <Route path="/buyer" element={<ProtectedRoute role="buyer"><Layout><BuyerDashboard /></Layout></ProtectedRoute>} />
            <Route path="/buyer/tab/:tabId" element={<ProtectedRoute role="buyer"><Layout><TabDetail /></Layout></ProtectedRoute>} />
            <Route path="/buyer/consumption" element={<ProtectedRoute role="buyer"><Layout><ConsumptionPage /></Layout></ProtectedRoute>} />
            <Route path="/buyer/limits" element={<ProtectedRoute role="buyer"><Layout><LimitsPage /></Layout></ProtectedRoute>} />
            <Route path="/buyer/payments" element={<ProtectedRoute role="buyer"><Layout><BuyerPayments /></Layout></ProtectedRoute>} />

            {/* Common */}
            <Route path="/scan" element={<ProtectedRoute><Layout><ScanPage /></Layout></ProtectedRoute>} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
