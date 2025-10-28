import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import SignaturePad from './SignaturePad';
import Swal from 'sweetalert2';

const AsChiefSignLogbook = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [logbookData, setLogbookData] = useState(null);
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    const fetchLogbookData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axiosInstance.get(`/api/logbook-harian-master/detail/${id}`);
        console.log('Logbook data:', response.data);
        setLogbookData(response.data);
      } catch (err) {
        console.error('Error fetching logbook:', err);
        setError('Gagal memuat data logbook');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchLogbookData();
  }, [id]);

  const handleBack = () => navigate('/assistant-chief/belum-ditandatangani');

  const handleSignLogbook = async () => {
    if (!logbookData.ttd_chief || logbookData.ttd_chief.trim() === '') {
      setError('Harap tanda tangan terlebih dahulu');
      return;
    }

    // Show confirmation dialog
    const result = await Swal.fire({
      title: 'Konfirmasi',
      text: 'Apakah Anda yakin ingin menandatangani dan menyelesaikan logbook ini?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya, Tandatangani',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) {
      return;
    }

    setSigning(true);
    setError(null);

    try {
      // Show loading state
      Swal.fire({
        title: 'Menandatangani...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Update the logbook with assistant chief signature and mark as completed
      const updatedData = {
        ...logbookData,
        ttd_chief: logbookData.ttd_chief,
        status: 'Completed'
      };

      await axiosInstance.put(`/api/logbook-harian-master/${id}`, updatedData);
      
      // Show success message
      await Swal.fire({
        title: 'Berhasil!',
        text: 'Logbook berhasil ditandatangani dan diselesaikan',
        icon: 'success',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'OK'
      });
      
      // Navigate back to unsigned reports
      navigate('/assistant-chief/belum-ditandatangani');
    } catch (err) {
      console.error('Error signing logbook:', err);
      
      // Show error message
      await Swal.fire({
        title: 'Error!',
        text: `Gagal menandatangani logbook: ${err.response?.data?.error || err.message}`,
        icon: 'error',
        confirmButtonColor: '#d33',
        confirmButtonText: 'OK'
      });
      
      setError(`Gagal menandatangani logbook: ${err.response?.data?.error || err.message}`);
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="loader"></div>
          <p className="mt-4 text-gray-600">Memuat data logbook...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded max-w-md">{error}</div>
          <button onClick={handleBack} className="mt-4 text-blue-600 hover:underline">Kembali</button>
        </div>
      </div>
    );
  }

  if (!logbookData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded max-w-md">Data logbook tidak ditemukan</div>
          <button onClick={handleBack} className="mt-4 text-blue-600 hover:underline">Kembali</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 fade-in">
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <button 
            type="button" 
            className="text-blue-600 hover:underline flex items-center" 
            onClick={handleBack}
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Kembali
          </button>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 ml-6">Tandatangani Logbook Harian</h2>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* Header Information */}
          <div className="border-b border-gray-200 pb-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                <p className="text-lg font-semibold text-gray-900">{logbookData.tanggal}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Regu</label>
                <p className="text-lg font-semibold text-gray-900">{logbookData.regu}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
                <p className="text-lg font-semibold text-gray-900">{logbookData.shift}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pos</label>
                <p className="text-lg font-semibold text-gray-900">{logbookData.lokasi}</p>
              </div>
            </div>
          </div>

          {/* Main Content Tables */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Detail Logbook Harian</h3>
            
            {/* Inventaris Table */}
            {logbookData.uraian_inventaris_list && logbookData.uraian_inventaris_list.length > 0 && (
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-800 mb-3">Inventaris</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">No</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">Nama Inventaris</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">Jumlah</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logbookData.uraian_inventaris_list.map((inventaris, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200">{idx + 1}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200">{inventaris.nama_inventaris || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200">{inventaris.jumlah || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Uraian Tugas Table */}
            {logbookData.uraian_tugas_list && logbookData.uraian_tugas_list.length > 0 && (
              <div>
                <h4 className="text-md font-semibold text-gray-800 mb-3">Uraian Tugas</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">No</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">Jam Mulai</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">Jam Selesai</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">Uraian Tugas</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logbookData.uraian_tugas_list.map((tugas, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200">{idx + 1}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200">{tugas.jam_mulai || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200">{tugas.jam_akhir || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200">{tugas.uraian_tugas || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200">{tugas.keterangan || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-gray-200">
            {/* Yang Menyerahkan */}
            <div className="text-center">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Yang Menyerahkan</h4>
              <div className="mb-2">
                <p className="text-sm text-gray-900 font-medium">{logbookData.nama_yg_menyerahkan}</p>
              </div>
              {logbookData.ttd_yg_menyerahkan && logbookData.ttd_yg_menyerahkan.trim() !== '' ? (
                <div className="border border-gray-300 rounded-lg p-2 bg-gray-50 min-h-[100px] flex items-center justify-center">
                  <img src={logbookData.ttd_yg_menyerahkan} alt="Tanda tangan yang menyerahkan" className="max-w-full max-h-[80px] object-contain" />
                </div>
              ) : (
                <div className="border border-gray-300 rounded-lg p-2 bg-gray-50 min-h-[100px] flex items-center justify-center text-gray-400 text-sm">
                  Belum ada tanda tangan
                </div>
              )}
            </div>

            {/* Yang Menerima */}
            <div className="text-center">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Yang Menerima</h4>
              <div className="mb-2">
                <p className="text-sm text-gray-900 font-medium">{logbookData.nama_yg_menerima}</p>
              </div>
              {logbookData.ttd_yg_menerima && logbookData.ttd_yg_menerima.trim() !== '' ? (
                <div className="border border-gray-300 rounded-lg p-2 bg-gray-50 min-h-[100px] flex items-center justify-center">
                  <img src={logbookData.ttd_yg_menerima} alt="Tanda tangan yang menerima" className="max-w-full max-h-[80px] object-contain" />
                </div>
              ) : (
                <div className="border border-gray-300 rounded-lg p-2 bg-gray-50 min-h-[100px] flex items-center justify-center text-gray-400 text-sm">
                  Belum ada tanda tangan
                </div>
              )}
            </div>

            {/* Assistant Chief - Editable Signature */}
            <div className="text-center">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Assistant Chief</h4>
              <div className="mb-2">
                <p className="text-sm text-gray-900 font-medium">{logbookData.nama_chief || 'N/A'}</p>
              </div>
              <div className="min-h-[100px]">
                <SignaturePad
                  onSignatureChange={(signature) => setLogbookData(prev => ({ ...prev, ttd_chief: signature }))}
                  defaultValue={logbookData.ttd_chief}
                  placeholder="Tanda tangan assistant chief"
                  disabled={false}
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-700">Status: </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  logbookData.status === 'submitted' || logbookData.status === 'Submitted' ? 'bg-blue-100 text-blue-800' :
                  logbookData.status === 'Draft' ? 'bg-gray-100 text-gray-800' :
                  logbookData.status === 'completed' || logbookData.status === 'Completed' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {logbookData.status}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button 
                type="button"
                onClick={handleBack}
                className="w-full sm:w-auto bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 font-medium"
              >
                Kembali
              </button>
              <button 
                type="button"
                onClick={handleSignLogbook}
                className="w-full sm:w-auto bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium disabled:opacity-50" 
                disabled={signing || !logbookData.ttd_chief || logbookData.ttd_chief.trim() === ''}
              >
                {signing ? 'Menandatangani...' : 'Tandatangani & Selesaikan'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AsChiefSignLogbook;
