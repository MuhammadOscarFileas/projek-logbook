import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

const RouteChangeTracker = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { auth, saveCurrentPath, getLastPath } = useAuth();

  useEffect(() => {
    // Save current path when route changes (except for login)
    if (location.pathname !== '/login') {
      saveCurrentPath(location.pathname);
    }

    // Prevent back navigation to login if authenticated
    if (auth && location.pathname === '/login') {
      const lastPath = getLastPath();
      const dashboardPath = getDashboardPath(auth.user.role);
      
      // Redirect to last path or dashboard
      const redirectPath = lastPath && lastPath !== '/login' ? lastPath : dashboardPath;
      navigate(redirectPath, { replace: true });
    }
  }, [location, auth, navigate, saveCurrentPath, getLastPath]);

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

  // This component doesn't render anything
  return null;
};

export default RouteChangeTracker;
