import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { BookingProvider } from './contexts/BookingContext';
import { CoachProvider } from './contexts/CoachContext';
import { ReviewProvider } from './contexts/ReviewContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { InvoiceProvider } from './contexts/InvoiceContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppDataGate } from './components/AppDataGate';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Coach Browse Pages
import { CoachesListPage } from './pages/coaches/CoachesListPage';
import { CoachProfilePage } from './pages/coaches/CoachProfilePage';
import { BookingPage } from './pages/coaches/BookingPage';

// Parent Dashboard Pages
import { ParentHome } from './pages/parent/ParentHome';
import { ParentBookings } from './pages/parent/ParentBookings';

// Coach Dashboard Pages
import { CoachDashboard } from './pages/coach/CoachDashboard';
import { CoachProfileSetup } from './pages/coach/CoachProfileSetup';
import { CoachBookings } from './pages/coach/CoachBookings';
import { CoachSchedule } from './pages/coach/CoachSchedule';
import { CoachEarnings } from './pages/coach/CoachEarnings';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminAnalytics } from './pages/admin/AdminAnalytics';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminCoaches } from './pages/admin/AdminCoaches';
import { AdminBookings } from './pages/admin/AdminBookings';
import { AdminSettings } from './pages/admin/AdminSettings';

// Profile
import { ProfilePage } from './pages/ProfilePage';
import { NotFoundPage } from './pages/NotFoundPage';

// React Router doesn't scroll to an #anchor on navigation by default, so
// links like /#how-it-works land at the top of the page instead of the
// section. This restores normal anchor-link behavior.
function ScrollToHash() {
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const el = document.querySelector(hash);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, [hash]);
  return null;
}

// SPA navigation doesn't reset scroll position the way a real page load
// does — without this, clicking from a scrolled-down list into a detail
// page (e.g. coaches list -> coach profile) leaves you mid-page instead of
// at the top.
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) return; // let ScrollToHash handle anchor links
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
        <InvoiceProvider>
        <CoachProvider>
          <ReviewProvider>
          <BookingProvider>
            <ScrollToHash />
            <ScrollToTop />
            <AppDataGate>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/coaches" element={<CoachesListPage />} />
              <Route path="/coaches/:id" element={<CoachProfilePage />} />
              <Route path="/coaches/:id/book" element={
                <ProtectedRoute>
                  <BookingPage />
                </ProtectedRoute>
              } />

              {/* Parent Dashboard */}
              <Route path="/parent/home" element={
                <ProtectedRoute role="parent">
                  <ParentHome />
                </ProtectedRoute>
              } />
              <Route path="/parent/bookings" element={
                <ProtectedRoute role="parent">
                  <ParentBookings />
                </ProtectedRoute>
              } />

              {/* Coach Dashboard */}
              <Route path="/coach/dashboard" element={
                <ProtectedRoute role="coach">
                  <CoachDashboard />
                </ProtectedRoute>
              } />
              <Route path="/coach/profile-setup" element={
                <ProtectedRoute role="coach">
                  <CoachProfileSetup />
                </ProtectedRoute>
              } />
              <Route path="/coach/bookings" element={
                <ProtectedRoute role="coach">
                  <CoachBookings />
                </ProtectedRoute>
              } />
              <Route path="/coach/schedule" element={
                <ProtectedRoute role="coach">
                  <CoachSchedule />
                </ProtectedRoute>
              } />
              <Route path="/coach/earnings" element={
                <ProtectedRoute role="coach">
                  <CoachEarnings />
                </ProtectedRoute>
              } />

              {/* Admin Dashboard */}
              <Route path="/admin" element={
                <ProtectedRoute role={['admin', 'gm']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/analytics" element={
                <ProtectedRoute role={['admin', 'gm']}>
                  <AdminAnalytics />
                </ProtectedRoute>
              } />
              <Route path="/admin/users" element={
                <ProtectedRoute role={['admin', 'gm']}>
                  <AdminUsers />
                </ProtectedRoute>
              } />
              <Route path="/admin/coaches" element={
                <ProtectedRoute role={['admin', 'gm']}>
                  <AdminCoaches />
                </ProtectedRoute>
              } />
              <Route path="/admin/bookings" element={
                <ProtectedRoute role={['admin', 'gm']}>
                  <AdminBookings />
                </ProtectedRoute>
              } />
              <Route path="/admin/settings" element={
                <ProtectedRoute role="admin">
                  <AdminSettings />
                </ProtectedRoute>
              } />

              {/* Profile */}
              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />

              {/* Fallback */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
            </AppDataGate>
          </BookingProvider>
          </ReviewProvider>
        </CoachProvider>
        </InvoiceProvider>
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
