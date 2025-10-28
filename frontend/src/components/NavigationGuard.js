import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

const NavigationGuard = ({ children }) => {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Prevent back navigation to login page if user is authenticated
    const handleBeforeUnload = (e) => {
      if (auth && location.pathname === '/login') {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    // Handle browser back button and history manipulation
    const handlePopState = (e) => {
      if (auth && location.pathname === '/login') {
        // If user tries to go back to login while authenticated, redirect to dashboard
        const dashboardPath = getDashboardPath(auth.user.role);
        navigate(dashboardPath, { replace: true });
        
        // Push the dashboard route to history to replace the login route
        window.history.pushState(null, '', dashboardPath);
      }
    };

    // Intercept history changes to prevent navigation to login
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function(...args) {
      if (auth && args[2] === '/login') {
        // Prevent navigation to login if authenticated
        const dashboardPath = getDashboardPath(auth.user.role);
        args[2] = dashboardPath;
      }
      return originalPushState.apply(this, args);
    };

    window.history.replaceState = function(...args) {
      if (auth && args[2] === '/login') {
        // Prevent navigation to login if authenticated
        const dashboardPath = getDashboardPath(auth.user.role);
        args[2] = dashboardPath;
      }
      return originalReplaceState.apply(this, args);
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
      
      // Restore original history methods
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, [auth, location, navigate]);

  // Helper function to get dashboard path
  const getDashboardPath = (userRole) => {
    switch (userRole) {
      case 'officer':
        return '/dashboard/officer';
      case 'chief':
        return '/dashboard/chief';
      case 'assistant_chief':
        return '/dashboard/assistant-chief';
      case 'superadmin':
        return '/dashboard/superadmin';
      default:
        return '/dashboard/officer';
    }
  };

  // If user is authenticated and trying to access login page, redirect to dashboard
  if (auth && location.pathname === '/login') {
    const dashboardPath = getDashboardPath(auth.user.role);
    navigate(dashboardPath, { replace: true });
    return null;
  }

  return children;
};

export default NavigationGuard;
