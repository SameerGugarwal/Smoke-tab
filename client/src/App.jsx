import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';

// Auth
import LoginPage from './pages/auth/LoginPage';

// Vendor
import VendorDashboard from './pages/vendor/VendorDashboard';
import CustomerTab from './pages/vendor/CustomerTab';
import InventoryManager from './pages/vendor/InventoryManager';
import VendorAnalytics from './pages/vendor/VendorAnalytics';
import VendorQR from './pages/vendor/VendorQR';

// Buyer
import BuyerDashboard from './pages/buyer/BuyerDashboard';
import TabDetail from './pages/buyer/TabDetail';
import ConsumptionPage from './pages/buyer/ConsumptionPage';
import LimitsPage from './pages/buyer/LimitsPage';

// Common
import ScanPage from './pages/common/ScanPage';
import NotFoundPage from './pages/common/NotFoundPage';

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
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<RootRedirect />} />

          {/* Vendor */}
          <Route path="/vendor" element={<ProtectedRoute role="vendor"><Layout><VendorDashboard /></Layout></ProtectedRoute>} />
          <Route path="/vendor/customer/:tabId" element={<ProtectedRoute role="vendor"><Layout><CustomerTab /></Layout></ProtectedRoute>} />
          <Route path="/vendor/inventory" element={<ProtectedRoute role="vendor"><Layout><InventoryManager /></Layout></ProtectedRoute>} />
          <Route path="/vendor/analytics" element={<ProtectedRoute role="vendor"><Layout><VendorAnalytics /></Layout></ProtectedRoute>} />
          <Route path="/vendor/qr" element={<ProtectedRoute role="vendor"><Layout><VendorQR /></Layout></ProtectedRoute>} />

          {/* Buyer */}
          <Route path="/buyer" element={<ProtectedRoute role="buyer"><Layout><BuyerDashboard /></Layout></ProtectedRoute>} />
          <Route path="/buyer/tab/:tabId" element={<ProtectedRoute role="buyer"><Layout><TabDetail /></Layout></ProtectedRoute>} />
          <Route path="/buyer/consumption" element={<ProtectedRoute role="buyer"><Layout><ConsumptionPage /></Layout></ProtectedRoute>} />
          <Route path="/buyer/limits" element={<ProtectedRoute role="buyer"><Layout><LimitsPage /></Layout></ProtectedRoute>} />

          {/* Common */}
          <Route path="/scan" element={<ProtectedRoute><Layout><ScanPage /></Layout></ProtectedRoute>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
