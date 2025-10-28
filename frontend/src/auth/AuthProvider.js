import React, { createContext, useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper: decode JWT to get email
  function parseJwt(token) {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return null;
    }
  }

  // Validate token by fetching user by email from /api/users (if array)
  const validateToken = async (token) => {
    try {
      const decoded = parseJwt(token);
      if (!decoded?.email) return null;
      
      // Check if token is expired
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        return null;
      }
      
      const response = await axiosInstance.get('/api/users', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      // If response is array, find user by email
      if (Array.isArray(response.data)) {
        const user = response.data.find(u => u.email === decoded.email);
        return user || null;
      }
      // If response is user object
      if (response.data && response.data.email === decoded.email) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Token validation failed:', error);
      return null;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // First try to get user from sessionStorage (faster, no API call)
          const cachedUser = sessionStorage.getItem('user');
          if (cachedUser) {
            try {
              const userData = JSON.parse(cachedUser);
              // Check if token is still valid by decoding JWT
              const decoded = parseJwt(token);
              if (decoded && decoded.email === userData.email) {
                // Token is valid, use cached user data
                setAuth({ token, user: userData });
                return;
              }
            } catch (e) {
              // Invalid cached data, continue with API validation
            }
          }
          
          // If no cached data or invalid, validate token via API
          const userData = await validateToken(token);
          if (userData) {
            setAuth({ token, user: userData });
            // Store user data in sessionStorage for better persistence
            sessionStorage.setItem('user', JSON.stringify(userData));
          } else {
            // Clear invalid token
            localStorage.removeItem('token');
            sessionStorage.removeItem('user');
          }
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        // Don't clear token immediately on error, try to use cached data
        const cachedUser = sessionStorage.getItem('user');
        const token = localStorage.getItem('token');
        if (cachedUser && token) {
          try {
            const userData = JSON.parse(cachedUser);
            setAuth({ token, user: userData });
          } catch (e) {
            // If everything fails, clear auth
            localStorage.removeItem('token');
            sessionStorage.removeItem('user');
          }
        }
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  // On login, save token and user from login response
  const login = async (token, user) => {
    try {
      localStorage.setItem('token', token);
      sessionStorage.setItem('user', JSON.stringify(user));
      
      setAuth({ token, user });
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      localStorage.removeItem('token');
      sessionStorage.removeItem('user');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setAuth(null);
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!auth && !!auth.token;
  };

  // Get current user
  const getCurrentUser = () => {
    return auth?.user || null;
  };

  // Save current navigation path
  const saveCurrentPath = (path) => {
    if (auth && path !== '/login') {
      sessionStorage.setItem('lastPath', path);
    }
  };

  // Get last saved path
  const getLastPath = () => {
    return sessionStorage.getItem('lastPath');
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ 
      auth, 
      login, 
      logout, 
      isAuthenticated, 
      getCurrentUser,
      saveCurrentPath,
      getLastPath
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider; 