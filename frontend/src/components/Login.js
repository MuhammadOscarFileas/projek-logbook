import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../auth/useAuth';
import axiosInstance from '../api/axiosInstance';
import yiaBackground from '../assets/yia.webp';
import avsecLogo from '../assets/avsec_logo.png';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, auth } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (auth) {
      const redirectPath = getDashboardPath(auth.user.role);
      navigate(redirectPath, { replace: true });
    }
  }, [auth, navigate]);

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
      case 'admin':
        return '/dashboard/superadmin';
      default:
        return '/dashboard/officer';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    let nip = '';
    
    nip = identifier;
    
    // Debug logging
    console.log('Frontend sending login data:', { nip, password });
    
    try {
      const res = await axiosInstance.post('/api/users/login', { nip, password });
      const { token, user } = res.data;
      
      const success = await login(token, user);
      if (success) {
        // Redirect based on role with replace to prevent back navigation
        const redirectPath = getDashboardPath(user.role);
        navigate(redirectPath, { replace: true });
      } else {
        setError('Login failed.');
      }
    } catch (err) {
      console.error('Frontend login error:', err.response?.data || err);
      setError(err.response?.data?.error || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  // If already authenticated, don't render login form
  if (auth) {
    return null;
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        backgroundImage: `url(${yiaBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay untuk memberikan efek gelap pada background */}
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      
      {/* Container utama */}
      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Card login dengan glassmorphism effect */}
        <div className="backdrop-blur-md bg-white bg-opacity-20 rounded-2xl shadow-2xl border border-white border-opacity-30 p-8">
          {/* Header dengan logo */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-white bg-opacity-90 rounded-full flex items-center justify-center shadow-lg">
              <img 
                src={avsecLogo} 
                alt="AVSEC Logo" 
                className="w-12 h-12 object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-white text-opacity-80">Sign in to your account</p>
          </div>

          {/* Form login */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Nomor Induk Pegawai
              </label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-white bg-opacity-90 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all duration-200 text-gray-800 placeholder-gray-500"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  required
                  placeholder="Masukkan NIP Anda"
                  autoFocus
                />
              </div>
            </div>
            
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  className="w-full px-4 py-3 bg-white bg-opacity-90 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all duration-200 text-gray-800 placeholder-gray-500"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="Masukkan Password Anda"
                />
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-500 bg-opacity-90 text-white px-4 py-3 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login; 