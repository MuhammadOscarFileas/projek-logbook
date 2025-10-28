import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/useAuth';
import { useNavigate } from 'react-router-dom';
import PasswordResetModal from '../PasswordResetModal';
import axiosInstance from '../../api/axiosInstance';

const ChiefDashboard = () => {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [reportsCount, setReportsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Check if user needs to reset password
  useEffect(() => {
    if (auth?.user?.first_login === true) {
      setShowPasswordReset(true);
    }
  }, [auth?.user?.first_login]);

  // Fetch reports count for dashboard
  useEffect(() => {
    const fetchReportsCount = async () => {
      if (!auth?.user?.pos) return;
      
      try {
        setLoading(true);
        const chiefLocation = auth.user.pos;
        
        try {
          // Get all logbook reports for chief's location
          const response = await axiosInstance.get(`/api/logbook-harian-master-chief/${encodeURIComponent(chiefLocation)}`);
          const reports = response.data;
          
          setReportsCount(reports.length);
        } catch (err) {
          console.error('Error fetching reports count:', err);
          setReportsCount(0);
        }
      } catch (err) {
        console.error('Error in fetchReportsCount:', err);
        setReportsCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchReportsCount();
  }, [auth?.user?.pos]);

  const handlePasswordResetSuccess = () => {
    setShowPasswordReset(false);
    // The auth context is already updated by the modal
  };

  const handleLaporanClick = () => {
    // Navigate to all reports page for chief's location
    const pos = auth?.user?.pos;
    if (pos) {
      navigate(`/chief/laporan?lokasi=${encodeURIComponent(pos)}`);
    } else {
      navigate('/chief/laporan');
    }
  };

  const handleChiefLogbookClick = () => {
    const lokasi = auth?.user?.lokasi;
    if (lokasi) {
      navigate(`/forms/masters/logbook-chief?lokasi=${encodeURIComponent(lokasi)}`);
    } else {
      navigate(`/forms/masters/logbook-chief`);
    }
  };

  const handleLkpClick = () => {
    navigate('/forms/masters/form-kemajuan-personel');
  };

  return (
    <>
      {showPasswordReset && auth?.user && (
        <PasswordResetModal
          user={auth.user}
          onSuccess={handlePasswordResetSuccess}
          onClose={() => setShowPasswordReset(false)}
        />
      )}
      <div className="min-h-screen bg-gray-50 fade-in p-6">
        <div className="w-full">
          {/* Baris 1: Selamat Datang */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Selamat Datang, {auth?.user?.nama_lengkap || 'Chief'}!
            </h1>
            <p className="text-gray-600">Kelola laporan dan tanda tangan sebagai chief</p>
          </div>

          {/* Baris 1.5: Log Book Chief (Pos) */}
          <div className="grid grid-cols-1 mb-6">
            <div 
              className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow duration-300 border border-blue-100"
              onClick={handleChiefLogbookClick}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">Log Book Chief {auth?.user?.pos ? `${auth.user.pos}` : ''}</h3>
                  <p className="text-gray-600 text-sm">Buat atau kelola logbook harian Anda</p>
                </div>
                <div className="text-blue-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v8m-4-4h8" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Baris 1.6: Laporan Kemajuan Personel (LKP) */}
          <div className="grid grid-cols-1 mb-6">
            <div 
              className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow duration-300 border border-green-100"
              onClick={handleLkpClick}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">Laporan Kemajuan Personel (LKP)</h3>
                  <p className="text-gray-600 text-sm">Kelola laporan kemajuan personel untuk monitoring kinerja tim</p>
                </div>
                <div className="text-green-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Baris 2: 1 Card */}
          <div className="grid grid-cols-1 gap-6">
            {/* Card Laporan */}
            <div 
              className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow duration-300"
              onClick={handleLaporanClick}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Laporan</h3>
                  <p className="text-gray-600 text-sm">Kelola semua logbook harian di unit {auth?.user?.pos ? `${auth.user.pos}`: ''}</p>
                </div>
                <div className="text-blue-600 relative">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChiefDashboard; 