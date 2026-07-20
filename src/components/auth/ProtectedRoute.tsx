import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole, hasRole } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requiredPermission?: string;
}

const SENSITIVE_PATHS = [
  '/checkout',
  '/subscriptions',
  '/dashboard',
  '/admin',
  '/driver',
  '/orders',
  '/profile',
  '/settings',
  '/payment',
  '/billing',
];

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles,
  requiredPermission
}) => {
  const { user, profile, loading, isEmailVerified, sendVerificationEmail } = useAuth();
  const location = useLocation();
  const [sending, setSending] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="w-16 h-16 border-4 border-coffee-200 border-t-coffee-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (profile && (profile.status === 'disabled' || profile.status === 'suspended')) {
    return <Navigate to="/auth" replace />;
  }

  const needsVerification = !isEmailVerified && SENSITIVE_PATHS.some(path => location.pathname.startsWith(path));

  if (needsVerification) {
    const handleResend = async () => {
      setSending(true);
      await sendVerificationEmail();
      setSending(false);
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="max-w-md w-full mx-4 p-8 bg-white rounded-lg shadow-lg text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-coffee-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-coffee-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-coffee-800 mb-2">Email Verification Required</h2>
          <p className="text-gray-600 mb-6">Please verify your email to access this page.</p>
          <p className="text-sm text-gray-500 mb-6">
            Check your inbox for the verification email. Didn't receive it?
          </p>
          <button
            onClick={handleResend}
            disabled={sending}
            className="px-6 py-2.5 bg-coffee-600 text-white rounded-lg hover:bg-coffee-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? 'Sending...' : 'Resend verification email'}
          </button>
        </div>
      </div>
    );
  }

  if (profile && requiredPermission) {
    const isSuperOrAdmin = profile.role === UserRole.OWNER || profile.role === UserRole.SUPER_ADMIN || profile.role === UserRole.ADMIN;
    const hasPerm = isSuperOrAdmin || (profile.permissions && profile.permissions.includes(requiredPermission));
    if (!hasPerm) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-cream">
          <div className="max-w-md w-full mx-4 p-8 bg-white rounded-lg shadow-lg text-center border border-red-100">
            <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-6">You do not have the required permission ({requiredPermission}) to access this page.</p>
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-2 bg-espresso text-white rounded-lg font-bold hover:bg-caramel transition-colors"
            >
              Go to Homepage
            </button>
          </div>
        </div>
      );
    }
  }

  if (allowedRoles) {
    if (!profile) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-cream">
          <div className="w-16 h-16 border-4 border-coffee-200 border-t-coffee-600 rounded-full animate-spin"></div>
        </div>
      );
    }

    if (!hasRole(profile.role, allowedRoles)) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};
