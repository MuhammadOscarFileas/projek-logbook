import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/useAuth';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import SignaturePad from '../SignaturePad';
import Swal from 'sweetalert2';

// Add custom CSS for SweetAlert popup
const customStyles = `
  <style>
    .swal-signature-popup {
      max-width: 90vw !important;
      width: auto !important;
    }
    
    .swal-signature-container {
      padding: 10px !important;
    }
    
    .swal2-confirm:disabled {
      opacity: 0.5 !important;
      cursor: not-allowed !important;
      background-color: #9ca3af !important;
    }
    
    .swal2-confirm:not(:disabled) {
      opacity: 1 !important;
      cursor: pointer !important;
    }
    
    @media (max-width: 768px) {
      .swal-signature-popup {
        margin: 10px !important;
        width: calc(100vw - 20px) !important;
      }
      
      .swal-signature-container {
        padding: 5px !important;
      }
      
      #signature-pad-container canvas {
        width: 100% !important;
        height: auto !important;
        max-width: 280px !important;
        max-height: 150px !important;
      }
    }
  </style>
`;

const AsChiefUnsignedReports = () => {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReports, setSelectedReports] = useState([]);
  const [showBottomBar, setShowBottomBar] = useState(false);

  useEffect(() => {
    const fetchUnsignedReports = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use a simple approach to get unsigned reports for chief
        const chiefName = auth?.user?.nama_lengkap;
        console.log('Fetching reports for chief:', chiefName);
        
        // Get all logbook reports and filter
        const response = await axiosInstance.get('/api/logbook-harian-master/');
        console.log('Backend response:', response.data);
        
        // Filter reports for this chief that are submitted but not signed
        const allReports = response.data.filter(report => 
          report.nama_chief === chiefName &&
          report.status === 'Submitted' &&
          (!report.ttd_chief || report.ttd_chief === '')
        ).map(report => ({
          ...report,
          type: 'Logbook Harian',
          modelName: 'logbook_harian_master'
        }));
        
        console.log('Final reports array:', allReports);
        setReports(allReports);
      } catch (err) {
        console.error('Error fetching unsigned reports:', err);
        setError('Gagal mengambil data laporan');
      } finally {
        setLoading(false);
      }
    };

    if (auth?.user?.nama_lengkap) {
      fetchUnsignedReports();
    }
  }, [auth?.user?.nama_lengkap]);

  // Handle checkbox selection
  const handleCheckboxChange = (reportId) => {
    setSelectedReports(prev => {
      const newSelection = prev.includes(reportId)
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId];
      
      // Show/hide bottom bar based on selection
      setShowBottomBar(newSelection.length > 0);
      
      return newSelection;
    });
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedReports.length === reports.length) {
      setSelectedReports([]);
      setShowBottomBar(false);
    } else {
      setSelectedReports(reports.map(report => report.id));
      setShowBottomBar(true);
    }
  };

  // Handle bulk signing
  const handleSignAll = async () => {
    if (selectedReports.length === 0) return;

    try {
      // Show SweetAlert with SignaturePad
      const { value: signature } = await Swal.fire({
        title: 'Tanda Tangan',
        html: `
          ${customStyles}
          <div class="mb-4">
            <p class="text-sm text-gray-600 mb-2">Tandatangani untuk ${selectedReports.length} laporan yang dipilih</p>
            <div id="signature-pad-container" class="border border-gray-300 rounded-lg p-2"></div>
            <p class="text-xs text-gray-500 mt-2">Gambar tanda tangan Anda di atas</p>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Tandatangani Semua',
        cancelButtonText: 'Batal',
        showLoaderOnConfirm: true,
        allowOutsideClick: false,
        width: window.innerWidth < 768 ? '90%' : '500px',
        customClass: {
          popup: 'swal-signature-popup',
          container: 'swal-signature-container'
        },
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        // Show confirm button but initially disabled
        showConfirmButton: true,
        preConfirm: () => {
          const signaturePad = document.querySelector('#signature-pad-container canvas');
          if (signaturePad) {
            // Check if signature is not empty
            const ctx = signaturePad.getContext('2d');
            const imageData = ctx.getImageData(0, 0, signaturePad.width, signaturePad.height);
            const hasSignature = imageData.data.some(channel => channel !== 0);
            
            if (!hasSignature) {
              Swal.showValidationMessage('Harap gambar tanda tangan terlebih dahulu');
              return false;
            }
            
            return signaturePad.toDataURL();
          }
          Swal.showValidationMessage('Signature pad tidak tersedia');
          return false;
        },
        didOpen: () => {
          // Initialize SignaturePad with responsive sizing
          const container = document.getElementById('signature-pad-container');
          if (container) {
            const isMobile = window.innerWidth < 768;
            const canvasWidth = isMobile ? 280 : 400;
            const canvasHeight = isMobile ? 150 : 200;
            
            container.innerHTML = `
              <canvas 
                width="${canvasWidth}" 
                height="${canvasHeight}" 
                style="border: 1px solid #ccc; border-radius: 4px; width: 100%; height: auto; max-width: 100%; touch-action: none;"
              ></canvas>
              <div class="mt-2 text-center">
                <button id="clear-signature-btn" class="text-sm text-red-600 hover:text-red-800 px-2 py-1 border border-red-300 rounded hover:bg-red-50">
                  Hapus Tanda Tangan
                </button>
              </div>
            `;
            
            const canvas = container.querySelector('canvas');
            const ctx = canvas.getContext('2d');
            let isDrawing = false;
            let lastX = 0;
            let lastY = 0;
            let hasSignature = false;

            // Mouse events for desktop
            canvas.addEventListener('mousedown', startDrawing);
            canvas.addEventListener('mousemove', draw);
            canvas.addEventListener('mouseup', stopDrawing);
            canvas.addEventListener('mouseout', stopDrawing);

            // Touch events for mobile
            canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
            canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
            canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

            function startDrawing(e) {
              isDrawing = true;
              const rect = canvas.getBoundingClientRect();
              [lastX, lastY] = [e.clientX - rect.left, e.clientY - rect.top];
            }

            function draw(e) {
              if (!isDrawing) return;
              const rect = canvas.getBoundingClientRect();
              const currentX = e.clientX - rect.left;
              const currentY = e.clientY - rect.top;
              
              ctx.beginPath();
              ctx.moveTo(lastX, lastY);
              ctx.lineTo(currentX, currentY);
              ctx.strokeStyle = '#000';
              ctx.lineWidth = 2;
              ctx.lineCap = 'round';
              ctx.stroke();
              
              [lastX, lastY] = [currentX, currentY];
              
              // Check if signature exists and enable confirm button
              if (!hasSignature) {
                hasSignature = true;
                // Enable confirm button when signature is drawn
                const confirmButton = Swal.getConfirmButton();
                if (confirmButton) {
                  confirmButton.disabled = false;
                  confirmButton.style.opacity = '1';
                  confirmButton.style.cursor = 'pointer';
                  confirmButton.textContent = 'Tandatangani Semua';
                  confirmButton.style.backgroundColor = '#3085d6';
                }
              }
            }

            function stopDrawing() {
              isDrawing = false;
            }

            // Touch event handlers for mobile
            function handleTouchStart(e) {
              e.preventDefault();
              const touch = e.touches[0];
              const rect = canvas.getBoundingClientRect();
              [lastX, lastY] = [touch.clientX - rect.left, touch.clientY - rect.top];
              isDrawing = true;
            }

            function handleTouchMove(e) {
              e.preventDefault();
              if (!isDrawing) return;
              
              const touch = e.touches[0];
              const rect = canvas.getBoundingClientRect();
              const currentX = touch.clientX - rect.left;
              const currentY = touch.clientY - rect.top;
              
              ctx.beginPath();
              ctx.moveTo(lastX, lastY);
              ctx.lineTo(currentX, currentY);
              ctx.strokeStyle = '#000';
              ctx.lineWidth = 2;
              ctx.lineCap = 'round';
              ctx.stroke();
              
              [lastX, lastY] = [currentX, currentY];
              
              // Check if signature exists and enable confirm button
              if (!hasSignature) {
                hasSignature = true;
                // Enable confirm button when signature is drawn
                const confirmButton = Swal.getConfirmButton();
                if (confirmButton) {
                  confirmButton.disabled = false;
                  confirmButton.style.opacity = '1';
                  confirmButton.style.cursor = 'pointer';
                  confirmButton.textContent = 'Tandatangani Semua';
                  confirmButton.style.backgroundColor = '#3085d6';
                }
              }
            }

            function handleTouchEnd(e) {
              e.preventDefault();
              isDrawing = false;
            }

            // Clear canvas initially
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Add clear button functionality
            const clearButton = document.getElementById('clear-signature-btn');
            if (clearButton) {
              clearButton.addEventListener('click', () => {
                // Clear canvas
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Reset signature state and disable confirm button
                hasSignature = false;
                const confirmButton = Swal.getConfirmButton();
                if (confirmButton) {
                  confirmButton.disabled = true;
                  confirmButton.style.opacity = '0.5';
                  confirmButton.style.cursor = 'not-allowed';
                  confirmButton.textContent = 'Harap Tandatangan';
                  confirmButton.style.backgroundColor = '#9ca3af';
                }
              });
            }
            
            // Initially disable confirm button
            setTimeout(() => {
              const confirmButton = Swal.getConfirmButton();
              if (confirmButton) {
                confirmButton.disabled = true;
                confirmButton.style.opacity = '0.5';
                confirmButton.style.cursor = 'not-allowed';
                confirmButton.textContent = 'Tandatangani Semua';
                confirmButton.style.backgroundColor = '#9ca3af';
              }
            }, 100);
          }
        }
      });

      if (signature) {
        // Show loading state
        Swal.fire({
          title: 'Menandatangani...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        // Sign all selected reports
        const signPromises = selectedReports.map(reportId => {
          const report = reports.find(r => r.id === reportId);
          if (report) {
            return axiosInstance.put(`/api/logbook-harian-master/${reportId}`, {
              ...report,
              ttd_chief: signature,
              status: 'Completed'
            });
          }
          return Promise.resolve();
        });

        await Promise.all(signPromises);

        // Show success message
        await Swal.fire({
          title: 'Berhasil!',
          text: `${selectedReports.length} laporan berhasil ditandatangani`,
          icon: 'success',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'OK'
        });

        // Clear selection and refresh data
        setSelectedReports([]);
        setShowBottomBar(false);
        
        // Refresh the reports list
        const chiefName = auth?.user?.nama_lengkap;
        const response = await axiosInstance.get('/api/logbook-harian-master/');
        const allReports = response.data.filter(report => 
          report.nama_chief === chiefName &&
          report.status === 'Submitted' &&
          (!report.ttd_chief || report.ttd_chief === '')
        ).map(report => ({
          ...report,
          type: 'Logbook Harian',
          modelName: 'logbook_harian_master'
        }));
        setReports(allReports);
      }
    } catch (err) {
      console.error('Error signing reports:', err);
      Swal.fire({
        title: 'Error!',
        text: 'Gagal menandatangani laporan',
        icon: 'error',
        confirmButtonColor: '#d33',
        confirmButtonText: 'OK'
      });
    }
  };

  const handleReportClick = (report) => {
    // Navigate to the specific report form based on modelName
    switch (report.modelName) {
      case 'logbook_harian_master':
        navigate(`/assistant-chief/sign-logbook/${report.id}`);
        break;
      case 'patroli_darat_master':
        navigate(`/forms/masters/patroli-darat/${report.id}`);
        break;
      case 'patroli_udara_master':
        navigate(`/forms/masters/patroli-udara/${report.id}`);
        break;
      case 'walking_patrol_master':
        navigate(`/forms/masters/walking-patrol/${report.id}`);
        break;
      case 'walking_patrol_non_terminal_master':
        navigate(`/forms/masters/walking-patrol-non-terminal/${report.id}`);
        break;
      case 'behaviour_master':
        navigate(`/forms/masters/behaviour/${report.id}`);
        break;
      case 'form_kemajuan_personel_master':
        navigate(`/forms/masters/kemajuan-personel/${report.id}`);
        break;
      case 'laporan_patroli_random_master':
        navigate(`/forms/masters/laporan-patroli-random/${report.id}`);
        break;
      case 'rotasi_personel_master':
        navigate(`/forms/masters/rotasi-personel/${report.id}`);
        break;
      case 'suspicious_master':
        navigate(`/forms/masters/suspicious/${report.id}`);
        break;
      default:
        console.log('Unknown report type:', report.modelName);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'done':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat laporan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-2">⚠️</div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 fade-in p-6">
      <div className="w-full">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Laporan Belum Ditandatangani</h1>
            <button
              onClick={() => navigate('/dashboard/assistant-chief')}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Kembali ke Dashboard
            </button>
          </div>
          <p className="text-gray-600">
            Menampilkan laporan yang menunggu tanda tangan Anda sebagai chief
          </p>
        </div>

        {/* Reports Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedReports.length === reports.length && reports.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jenis Laporan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      Tidak ada laporan yang menunggu tanda tangan
                    </td>
                  </tr>
                ) : (
                  reports.map((report, index) => (
                    <tr 
                      key={`${report.modelName}-${report.id}`} 
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedReports.includes(report.id)}
                          onChange={() => handleCheckboxChange(report.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(report.tanggal)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {report.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {report.lokasi || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(report.status)}`}>
                          {report.status || 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <button 
                          className="text-blue-600 hover:text-blue-900 font-medium"
                          onClick={() => handleReportClick(report)}
                        >
                          Lihat & Tandatangani
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 bg-white rounded-lg shadow p-4 mb-20">
          <p className="text-sm text-gray-600">
            Total laporan yang menunggu tanda tangan: <span className="font-semibold text-blue-600">{reports.length}</span>
          </p>
        </div>
      </div>

      {/* Bottom Bar with Animation */}
      {showBottomBar && (
        <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {selectedReports.length} laporan dipilih
              </span>
            </div>
            <button
              onClick={handleSignAll}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Sign All
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AsChiefUnsignedReports; 