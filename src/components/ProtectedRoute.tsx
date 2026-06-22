import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

type Role = 'parent' | 'coach' | 'admin' | 'gm';

interface ProtectedRouteProps {
  children: ReactNode;
  role?: Role | Role[];
}

export function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm font-medium">Loading CoachNow...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const allowedRoles = role ? (Array.isArray(role) ? role : [role]) : null;

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    // Redirect to appropriate dashboard
    if (currentUser.role === 'admin' || currentUser.role === 'gm') return <Navigate to="/admin" replace />;
    if (currentUser.role === 'coach') return <Navigate to="/coach/dashboard" replace />;
    return <Navigate to="/parent/home" replace />;
  }

  return <>{children}</>;
}
