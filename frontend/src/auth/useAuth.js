import { useContext } from 'react';
import { AuthContext } from './AuthProvider';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Custom hook for navigation state management
export const useNavigationState = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useNavigationState must be used within an AuthProvider');
  }
  
  const saveNavigationState = (path) => {
    if (context.auth) {
      sessionStorage.setItem('lastPath', path);
    }
  };

  const getLastPath = () => {
    return sessionStorage.getItem('lastPath');
  };

  const clearNavigationState = () => {
    sessionStorage.removeItem('lastPath');
  };

  return {
    saveNavigationState,
    getLastPath,
    clearNavigationState,
    ...context
  };
};

export default useAuth; 