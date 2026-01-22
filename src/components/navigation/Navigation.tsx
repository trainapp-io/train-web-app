import { Routes, Route } from "react-router";
import { useEffect, useState } from "react";
import { ProtectedRoute, AuthRoute, ResetPasswordRoute } from './RouteGuards';
import AuthPage from "../../app/access/views/AuthPage";
import PrivacyPolicy from "../../pages/PrivacyPolicy";
import TermsOfService from "../../pages/TermsOfService";
import Dashboard from "../../pages/Dashboard";
import PublicAvailabilityView from "../../app/events/views/PublicAvailabilityView";

interface NavigationProps {
  // You can add props here if needed in the future
}

const Navigation: React.FC<NavigationProps> = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated on app load
    const checkAuth = async () => {
      try {
        // You could add additional auth validation here if needed
        setLoading(false);
      } catch (error) {
        console.error('Auth check error:', error);
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
    {/* Protected section of the app */}
    <Route
      path="/*"
      element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      }
    />

    {/* Public / Auth routes */}
    <Route
      path="/login"
      element={
        <AuthRoute>
          <AuthPage authType="login" />
        </AuthRoute>
      }
    />
    <Route
      path="/register"
      element={
        <AuthRoute>
          <AuthPage authType="register" />
        </AuthRoute>
      }
    />
    <Route
      path="/forgot-password"
      element={
        <AuthRoute>
          <AuthPage authType="forgot-password" />
        </AuthRoute>
      }
    />
    <Route
      path="/reset-password"
      element={
        <ResetPasswordRoute>
          <AuthPage authType="reset-password" />
        </ResetPasswordRoute>
      }
    />

    {/* Public pages */}
    <Route path="/privacy" element={<PrivacyPolicy />} />
    <Route path="/terms-of-service" element={<TermsOfService />} />
    <Route path="/share/availability/:userId" element={<PublicAvailabilityView />} />
  </Routes>

  );
};

export default Navigation;
