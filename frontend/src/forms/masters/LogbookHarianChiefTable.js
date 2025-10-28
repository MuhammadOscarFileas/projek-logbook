import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../auth/useAuth';

const LogbookHarianChiefTable = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [reportsPerPage] = useState(10);

  // Map user pos to chief lokasi
  const getChiefLokasi = (pos) => {
    switch (pos) {
      case 'Terminal Protection':
        return 'Chief Terminal Protection';
      case 'Non-Terminal Protection':
        return 'Chief Non Terminal Protection';
      case 'Screening':
        return 'Chief Screening';
      default:
        return null;
    }
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    const userPos = auth?.user?.pos;
    const chiefLokasi = getChiefLokasi(userPos);
    
    if (!chiefLokasi) {
      setError('Pos user tidak valid untuk mengambil data chief');
      setLoading(false);
      return;
    }

    // Fetch logbooks for the specific chief lokasi
    const url = `/api/logbook-harian-master/harian/${encodeURIComponent(chiefLokasi)}`;
    axiosInstance.get(url)
      .then(res => setData(res.data))
      .catch(() => setError('Gagal mengambil data'))
      .finally(() => setLoading(false));
  }, [auth?.user?.pos]);

  const handleCardClick = (logbook) => {
    if (logbook.status === 'Completed' || logbook.status === 'Submitted') {
      navigate(`/logbook-preview/${logbook.id}`);
    } else {
      navigate(`/forms/masters/logbook-chief/${logbook.id}`);
    }
  };

  const handlePreview = (e, id) => {
    e.stopPropagation();
    navigate(`/logbook-preview/${id}`);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm('Apakah Anda yakin ingin menghapus logbook ini? Semua data uraian tugas dan inventaris akan ikut terhapus.')) {
      try {
        console.log('Attempting to delete logbook with ID:', id);
        
        // Delete the main logbook (backend should handle cascading deletes)
        const response = await axiosInstance.delete(`/api/logbook-harian-master/${id}`);
        console.log('Delete response:', response);
        
        setData(data.filter(item => item.id !== id));
        alert('Logbook berhasil dihapus');
      } catch (err) {
        console.error('Delete error:', err);
        console.error('Error response:', err.response?.data);
        alert(`Gagal menghapus logbook: ${err.response?.data?.error || err.message}`);
      }
    }
  };

  const handleCreate = () => {
    const userPos = auth?.user?.pos;
    const chiefLokasi = getChiefLokasi(userPos);
    if (chiefLokasi) {
      navigate(`/forms/masters/logbook-chief/create?lokasi=${encodeURIComponent(chiefLokasi)}`);
    } else {
      navigate('/forms/masters/logbook-chief/create');
    }
  };

  // Get chief lokasi for display
  const getDisplayLokasi = () => {
    const userPos = auth?.user?.pos;
    return getChiefLokasi(userPos);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'submitted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'draft':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        );
      case 'submitted':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        );
      case 'completed':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Derived data and pagination (match officer's table)
  const draftLogbooks = data.filter(logbook => logbook.status === 'Draft');
  const submittedCompletedLogbooks = data.filter(logbook => 
    logbook.status === 'Submitted' || logbook.status === 'Completed'
  ).sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal)); // Sort by newest date first

  const indexOfLastReport = currentPage * reportsPerPage;
  const indexOfFirstReport = indexOfLastReport - reportsPerPage;
  const currentReports = submittedCompletedLogbooks.slice(indexOfFirstReport, indexOfLastReport);
  const totalPages = Math.ceil(submittedCompletedLogbooks.length / reportsPerPage);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Logbook Harian Chief {getDisplayLokasi() && <span className="text-blue-600 ml-2">({getDisplayLokasi()})</span>}
        </h2>
        <button
          onClick={handleCreate}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium shadow-sm"
        >
          + Buat Logbook Chief
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="loader"></div>
          <span className="ml-3 text-gray-500">Memuat data...</span>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="text-red-500 text-lg">{error}</div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Draft as cards */}
          <div>
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Hari Ini ({draftLogbooks.length})</h3>
            </div>
            {draftLogbooks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Tidak ada logbook dalam status Draft</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {draftLogbooks.map((logbook) => (
                  <div 
                    key={logbook.id} 
                    className="bg-white rounded-lg shadow-md border border-gray-200 p-4 hover:shadow-lg transition-shadow relative"
                  >
                    {/* Delete button for Draft logbooks */}
                    <button
                      onClick={(e) => handleDelete(e, logbook.id)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700 transition-colors duration-200 p-1 rounded-full hover:bg-red-50"
                      title="Hapus Logbook"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    
                    {/* Clickable content area */}
                    <div 
                      onClick={() => handleCardClick(logbook)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(logbook.status)}`}>
                          {getStatusIcon(logbook.status)}
                          <span className="ml-1">{logbook.status}</span>
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-medium text-gray-500">Tanggal:</span>
                          <p className="text-sm text-gray-900">{formatDate(logbook.tanggal)}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Shift:</span>
                          <p className="text-sm text-gray-900">{logbook.shift}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Regu:</span>
                          <p className="text-sm text-gray-900">{logbook.regu}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submitted & Completed combined as table */}
          <div>
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Submitted & Completed ({submittedCompletedLogbooks.length})</h3>
            </div>
            {submittedCompletedLogbooks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Tidak ada logbook dalam status Submitted atau Completed</div>
            ) : (
              <>
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shift</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Regu</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {currentReports.map((logbook) => (
                          <tr key={logbook.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleCardClick(logbook)}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatDate(logbook.tanggal)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{logbook.shift}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{logbook.regu}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(logbook.status)}`}>
                                {getStatusIcon(logbook.status)}
                                <span className="ml-1">{logbook.status}</span>
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <button onClick={(e) => handlePreview(e, logbook.id)} className="text-blue-600 hover:text-blue-800" title="Preview">
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {submittedCompletedLogbooks.length > 10 && (
                    <div className="px-6 py-3 bg-gray-50 text-sm text-gray-600 text-center">
                      Menampilkan {indexOfFirstReport + 1}-{Math.min(indexOfLastReport, submittedCompletedLogbooks.length)} dari {submittedCompletedLogbooks.length} laporan
                    </div>
                  )}
                </div>

                {totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-center">
                    <div className="flex items-center space-x-2">
                      <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Sebelumnya</button>
                      <span className="text-sm text-gray-700">Halaman {currentPage} dari {totalPages}</span>
                      <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Selanjutnya</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {!loading && !error && data.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">Tidak ada data logbook</div>
          <p className="text-gray-500">Belum ada logbook harian untuk lokasi {getDisplayLokasi()}.</p>
        </div>
      )}
    </div>
  );
};

export default LogbookHarianChiefTable;


