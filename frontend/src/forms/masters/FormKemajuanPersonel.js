import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/useAuth';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import Swal from 'sweetalert2';
import SignaturePad from '../../components/SignaturePad';

const FormKemajuanPersonel = () => {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [lkpList, setLkpList] = useState([]);
  const [formData, setFormData] = useState({
    unit: '',
    hari_tanggal: '',
    shift: '',
    pleton: '',
    jumlah_personil: '',
    jumlah_kekuatan: '',
    keterangan: '',
    nama_chief: '',
    ttd_chief: ''
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Check if user is chief
  useEffect(() => {
    if (auth?.user?.role !== 'chief' && auth?.user?.role !== 'superadmin') {
      navigate('/dashboard');
    }
  }, [auth, navigate]);

  // Fetch LKP data on component mount
  useEffect(() => {
    if (auth?.user?.role === 'chief' || auth?.user?.role === 'superadmin') {
      fetchLkpData();
    }
  }, [auth]);

  // Auto-fill unit and date only on initial mount
  useEffect(() => {
    if (auth?.user?.role === 'chief' || auth?.user?.role === 'superadmin' && !isEditMode) {
      const today = new Date().toISOString().split('T')[0];
      setFormData(prev => ({
        ...prev,
        unit: auth?.user?.pos || '',
        hari_tanggal: today
      }));
    }
  }, [auth?.user?.pos, isEditMode]);

  // Debug: Monitor formData changes
  useEffect(() => {
    console.log('Form data changed:', formData);
  }, [formData]);

  const fetchLkpData = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/form-kemajuan-personel');
      
      // Filter LKP data based on user's pos (unit)
      let filteredData = response.data;
      if (auth?.user?.pos && auth.user.pos !== 'superadmin') {
        filteredData = response.data.filter(lkp => lkp.unit === auth.user.pos);
      }
      
      // Sort by latest date (hari_tanggal) - newest first
      filteredData.sort((a, b) => {
        const dateA = new Date(a.hari_tanggal);
        const dateB = new Date(b.hari_tanggal);
        return dateB - dateA; // Descending order (newest first)
      });
      
      setLkpList(filteredData);
    } catch (err) {
      console.error('Error fetching data:', err);
      Swal.fire({
        title: 'Error!',
        text: 'Gagal mengambil data Laporan Kemajuan Personel',
        icon: 'error',
        confirmButtonColor: '#d33',
        confirmButtonText: 'OK'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.unit || !formData.hari_tanggal || !formData.shift || !formData.pleton || 
        !formData.jumlah_personil || !formData.jumlah_kekuatan || !formData.keterangan || !formData.ttd_chief) {
      Swal.fire({
        title: 'Error!',
        text: 'Semua field wajib diisi termasuk Shift dan Pleton, serta tanda tangan chief',
        icon: 'error',
        confirmButtonColor: '#d33',
        confirmButtonText: 'OK'
      });
      return;
    }

    try {
      setLoading(true);
      
      if (isEditMode) {
        // Update existing LKP
        await axiosInstance.put(`/api/form-kemajuan-personel/${editingId}`, {
          ...formData,
          nama_chief: auth?.user?.nama_lengkap
        });
        
        await Swal.fire({
          title: 'Berhasil!',
          text: 'Laporan Kemajuan Personel berhasil diupdate',
          icon: 'success',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'OK'
        });
      } else {
        // Create new LKP
        await axiosInstance.post('/api/form-kemajuan-personel', {
          ...formData,
          nama_chief: auth?.user?.nama_lengkap
        });
        
        await Swal.fire({
          title: 'Berhasil!',
          text: 'Laporan Kemajuan Personel berhasil disimpan',
          icon: 'success',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'OK'
        });
      }

      // Reset form and refresh data
      resetForm();
      fetchLkpData();
      
    } catch (err) {
      console.error('Error saving Laporan Kemajuan Personel:', err);
      Swal.fire({
        title: 'Error!',
        text: `Gagal ${isEditMode ? 'mengupdate' : 'menyimpan'} Laporan Kemajuan Personel: ${err.response?.data?.error || err.message}`,
        icon: 'error',
        confirmButtonColor: '#d33',
        confirmButtonText: 'OK'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (lkp) => {
    console.log('Editing LKP:', lkp); // Debug log
    
    // Set edit mode first to prevent useEffect from overriding
    setIsEditMode(true);
    setEditingId(lkp.id);
    
    // Then set form data
    setFormData({
      unit: lkp.unit || '',
      hari_tanggal: lkp.hari_tanggal || '',
      shift: lkp.shift || '',
      pleton: lkp.pleton || '',
      jumlah_personil: lkp.jumlah_personil || '',
      jumlah_kekuatan: lkp.jumlah_kekuatan || '',
      keterangan: lkp.keterangan || '',
      nama_chief: lkp.nama_chief || '',
      ttd_chief: lkp.ttd_chief || ''
    });
    
    console.log('Edit mode set to true, editing ID:', lkp.id); // Debug log
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Konfirmasi Hapus',
      text: 'Apakah Anda yakin ingin menghapus Laporan Kemajuan Personel ini?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        await axiosInstance.delete(`/api/form-kemajuan-personel/${id}`);
        
        await Swal.fire({
          title: 'Berhasil!',
          text: 'Laporan Kemajuan Personel berhasil dihapus',
          icon: 'success',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'OK'
        });
        
        fetchLkpData();
      } catch (err) {
        console.error('Error deleting Laporan Kemajuan Personel:', err);
        Swal.fire({
          title: 'Error!',
          text: 'Gagal menghapus Laporan Kemajuan Personel',
          icon: 'error',
          confirmButtonColor: '#d33',
          confirmButtonText: 'OK'
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Reset edit mode first
    setIsEditMode(false);
    setEditingId(null);
    
    // Then reset form data
    setFormData({
      unit: auth?.user?.pos || '',
      hari_tanggal: today,
      shift: '',
      pleton: '',
      jumlah_personil: '',
      jumlah_kekuatan: '',
      keterangan: '',
      nama_chief: '',
      ttd_chief: ''
    });
    
    console.log('Form reset, edit mode:', false); // Debug log
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

  if (auth?.user?.role !== 'chief' && auth?.user?.role !== 'superadmin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 fade-in p-6">
      <div className="w-full">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Laporan Kemajuan Personel</h1>
            <button
              onClick={() => navigate('/dashboard/chief')}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Kembali ke Dashboard
            </button>
          </div>
          <p className="text-gray-600">
            Kelola laporan kemajuan personel untuk monitoring kinerja tim
          </p>
        </div>

        {/* Form Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {isEditMode ? 'Edit Laporan Kemajuan Personel' : 'Tambah Laporan Kemajuan Personel Baru'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Unit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) => handleFormChange('unit', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Pilih Unit</option>
                  <option value="Terminal Protection">Terminal Protection</option>
                  <option value="Non-Terminal Protection">Non-Terminal Protection</option>
                  <option value="Screening">Screening</option>
                </select>
              </div>

              {/* Hari Tanggal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hari Tanggal <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.hari_tanggal}
                  onChange={(e) => handleFormChange('hari_tanggal', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Shift */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shift <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.shift}
                  onChange={(e) => handleFormChange('shift', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Pilih Shift</option>
                  <option value="Pagi (07:00 - 13:00)">Pagi (07:00 - 13:00)</option>
                  <option value="Siang (13:00 - 19:00)">Siang (13:00 - 19:00)</option>
                  <option value="Malam (19:00 - 07:00)">Malam (19:00 - 07:00)</option>
                </select>
              </div>

              {/* Pleton */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pleton <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.pleton}
                  onChange={(e) => handleFormChange('pleton', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Pilih Pleton</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Jumlah Personil */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jumlah Personil <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.jumlah_personil}
                  onChange={(e) => handleFormChange('jumlah_personil', e.target.value)}
                  placeholder="Contoh: 15 orang"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Jumlah Kekuatan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jumlah Kekuatan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.jumlah_kekuatan}
                  onChange={(e) => handleFormChange('jumlah_kekuatan', e.target.value)}
                  placeholder="Contoh: 20 personil"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Keterangan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Keterangan <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.keterangan}
                onChange={(e) => {
                  handleFormChange('keterangan', e.target.value);
                  // Auto-grow height
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                placeholder="Jelaskan detail kemajuan personel..."
                rows={1}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                required
              />
            </div>

            {/* Tanda Tangan Chief */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanda Tangan Chief <span className="text-red-500">*</span>
              </label>
              <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                <SignaturePad
                  onSignatureChange={(signature) => handleFormChange('ttd_chief', signature)}
                  defaultValue={formData.ttd_chief}
                  width={400}
                  height={200}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : (isEditMode ? 'Update' : 'Simpan')}
              </button>
              
              {isEditMode && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  Batal Edit
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Daftar Laporan Kemajuan Personel</h2>
              {auth?.user?.pos && (
                <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  Unit: {auth.user.pos}
                </span>
              )}
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Data diurutkan berdasarkan tanggal terbaru
            </div>
          </div>
          
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Memuat data...</p>
            </div>
          ) : lkpList.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              Belum ada data Laporan Kemajuan Personel
            </div>
          ) : (
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                      No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                      Unit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Tanggal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Shift
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Pleton
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Personil
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Kekuatan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Keterangan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                      Chief
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {lkpList.map((lkp, index) => (
                    <tr key={lkp.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {lkp.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(lkp.hari_tanggal)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lkp.shift}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lkp.pleton}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lkp.jumlah_personil}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lkp.jumlah_kekuatan}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="whitespace-pre-wrap break-words max-w-xs">
                          {lkp.keterangan}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="space-y-2">
                          {lkp.ttd_chief && (
                            <div className="w-20 h-12 border border-gray-300 rounded bg-white">
                              <img 
                                src={lkp.ttd_chief} 
                                alt="Tanda Tangan Chief" 
                                className="w-full h-full object-contain"
                              />
                            </div>
                          )}
                          <div className="font-medium">{lkp.nama_chief}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleEdit(lkp)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(lkp.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormKemajuanPersonel;
