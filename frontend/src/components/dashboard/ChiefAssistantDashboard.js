import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/useAuth';
import { useNavigate } from 'react-router-dom';
import PasswordResetModal from '../PasswordResetModal';
import axiosInstance from '../../api/axiosInstance';

const ChiefAssistantDashboard = () => {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [unsignedCount, setUnsignedCount] = useState(0);
  const [signedCount, setSignedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Check if user needs to reset password
  useEffect(() => {
    if (auth?.user?.first_login === true) {
      setShowPasswordReset(true);
    }
  }, [auth?.user?.first_login]);

    // Fetch counts for dashboard
  useEffect(() => {
    const fetchCounts = async () => {
      if (!auth?.user?.nama_lengkap) return;
      
      try {
        setLoading(true);
        const assistantName = auth.user.nama_lengkap;
        
        try {
          const response = await axiosInstance.get('/api/logbook-harian-master/');
          const allReports = response.data;
          
          console.log('Total reports in system:', allReports.length);
          console.log('Looking for assistant:', assistantName);
        
          const assistantReports = allReports.filter(report => 
            report.nama_chief === assistantName
          );
          
          if (assistantReports.length === 0) {
            console.log('No reports found for assistant as chief, trying alternative filters...');
            
            const alternativeReports = allReports.filter(report => 
              report.nama_yg_menyerahkan === assistantName ||
              report.nama_yg_menerima === assistantName
            );
            
            console.log('Alternative reports found:', alternativeReports.length);
            
            if (alternativeReports.length > 0) {
              // Use alternative reports for counting
              const unsignedCount = alternativeReports.filter(report => 
                !report.ttd_chief || report.ttd_chief.trim() === ''
              ).length;
              
              const signedCount = alternativeReports.filter(report => 
                report.ttd_chief && report.ttd_chief.trim() !== ''
              ).length;
              
              setUnsignedCount(unsignedCount);
              setSignedCount(signedCount);
            } else {
              // No reports found at all for this user
              setUnsignedCount(0);
              setSignedCount(0);
            }
          } else {
            // Count unsigned reports (no signature or empty signature)
            const unsignedCount = assistantReports.filter(report => 
              !report.ttd_chief || report.ttd_chief.trim() === ''
            ).length;
            
            // Count signed reports (with signature)
            const signedCount = assistantReports.filter(report => 
              report.ttd_chief && report.ttd_chief.trim() !== ''
            ).length;
            
            console.log('Assistant reports found:', assistantReports.length);
            console.log('Unsigned count:', unsignedCount);
            console.log('Signed count:', signedCount);
            console.log('Sample reports:', assistantReports.slice(0, 3));
            
            setUnsignedCount(unsignedCount);
            setSignedCount(signedCount);
          }
        } catch (err) {
          console.error('Error fetching reports for count:', err);
          setUnsignedCount(0);
          setSignedCount(0);
        }
      } catch (err) {
        console.error('Error in fetchCounts:', err);
        setUnsignedCount(0);
        setSignedCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, [auth?.user?.nama_lengkap, refreshTrigger]);



  const handlePasswordResetSuccess = () => {
    setShowPasswordReset(false);
    // The auth context is already updated by the modal
  };

  const handleLaporanClick = () => {
    // Navigate to signed reports page for assistant chief
    navigate('/assistant-chief/laporan-sudah-ditandatangani');
  };

  const handleBelumDitandatanganiClick = () => {
    // Navigate to unsigned reports page for assistant chief
    navigate('/assistant-chief/belum-ditandatangani');
  };

  const handleRefresh = () => {
    // Force refresh of counts
    setLoading(true);
    setRefreshTrigger(prev => prev + 1); // Increment trigger to force re-fetch
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
             <div className="flex justify-between items-center">
               <div>
                 <h1 className="text-3xl font-bold text-gray-900 mb-2">
                   Selamat Datang, {auth?.user?.nama_lengkap || 'Assistant Chief'}!
                 </h1>
                 <p className="text-gray-600">Kelola laporan dan tanda tangan sebagai assistant chief</p>
               </div>
               <button
                 onClick={handleRefresh}
                 disabled={loading}
                 className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
               >
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                 </svg>
                 {loading ? 'Memuat...' : 'Refresh'}
               </button>
             </div>
           </div>

          {/* Baris 2: 2 Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         {/* Card Laporan Sudah Ditandatangani */}
             <div 
               className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow duration-300"
               onClick={handleLaporanClick}
             >
               <div className="flex items-center justify-between">
                 <div>
                   <h3 className="text-xl font-semibold text-gray-900 mb-2">Laporan Sudah Ditandatangani</h3>
                   <p className="text-gray-600">
                     {loading ? 'Memuat...' : `${signedCount} laporan telah ditandatangani`}
                   </p>
                 </div>
                 <div className="text-green-600 relative">
                   <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                 </div>
               </div>
             </div>

                         {/* Card Belum Ditandatangani */}
             <div 
               className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow duration-300 relative"
               onClick={handleBelumDitandatanganiClick}
             >
               {/* Notification Badge */}
               {unsignedCount > 0 && (
                 <div className="absolute -top-2 -left-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold z-10">
                   {unsignedCount > 99 ? '99+' : unsignedCount}
                 </div>
               )}
               <div className="flex items-center justify-between">
                 <div>
                   <h3 className="text-xl font-semibold text-gray-900 mb-2">Belum Ditandatangani</h3>
                   <p className="text-gray-600">
                     {loading ? 'Memuat...' : `${unsignedCount} laporan menunggu tanda tangan`}
                   </p>
                 </div>
                 <div className="text-orange-600">
                   <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
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

export default ChiefAssistantDashboard;
