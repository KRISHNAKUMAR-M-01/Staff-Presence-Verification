import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import StaffDashboard from './pages/StaffDashboard';
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import { registerServiceWorker, subscribeToPush, saveSubscription } from './services/notificationService';


const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return <div className="loader-container"><div className="loader"></div></div>;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Check if user role is in allowed roles
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirect to appropriate dashboard based on role
    const redirectPath = user?.role === 'admin' ? '/admin' :
      ['principal', 'secretary', 'director'].includes(user?.role) ? '/executive' :
        '/staff';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

const AppContent = () => {
  const { isAuthenticated, user, token } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      const initPush = async () => {
        const registration = await registerServiceWorker();
        if (registration) {
          // Check for existing subscription
          let subscription = await registration.pushManager.getSubscription();

          if (!subscription) {
            // Subscribe if not already subscribed
            subscription = await subscribeToPush(registration);
          }

          if (subscription) {
            await saveSubscription(subscription, token);
          }
        }
      };
      initPush();
    }
  }, [isAuthenticated, token]);

  const getDefaultRoute = () => {
    if (!isAuthenticated) return '/login';
    if (user?.role === 'admin') return '/admin';
    if (['principal', 'secretary', 'director'].includes(user?.role)) return '/executive';
    return '/staff';
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to={getDefaultRoute()} replace /> : <Login />}
      />

      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/executive/*"
        element={
          <ProtectedRoute allowedRoles={['principal', 'secretary', 'director']}>
            <ExecutiveDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/staff/*"
        element={
          <ProtectedRoute allowedRoles={['staff']}>
            <StaffDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <AppContent />
      </Router>
    </AuthProvider>
  );
};

export default App;

