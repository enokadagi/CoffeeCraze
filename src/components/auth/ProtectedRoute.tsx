import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles 
}) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-coffee-50">
        <div className="w-16 h-16 border-4 border-coffee-200 border-t-coffee-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (allowedRoles) {
    if (loading || !profile) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-coffee-50">
          <div className="w-16 h-16 border-4 border-coffee-200 border-t-coffee-600 rounded-full animate-spin"></div>
        </div>
      );
    }

    if (!allowedRoles.includes(profile.role)) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};
