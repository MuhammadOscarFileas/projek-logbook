import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../auth/useAuth';
import SignaturePad from '../../components/SignaturePad';
import Swal from 'sweetalert2';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

// Searchable dropdown reused
const SearchableDropdown = ({ options, value, onChange, placeholder, required = false, className = "", disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const filteredOptions = options.filter(o => o.label.toLowerCase().includes(searchTerm.toLowerCase()));
  const selected = options.find(o => o.value === value);
  return (
    <div className={`relative ${className}`}>
      <div className={`w-full border border-gray-300 rounded-lg px-3 py-2 h-10 flex items-center ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white cursor-pointer'}`} onClick={() => !disabled && setIsOpen(!isOpen)}>
        <div className="flex justify-between items-center w-full">
          <span className={selected ? 'text-gray-900' : 'text-gray-500'}>{selected ? selected.label : placeholder}</span>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7 7" /></svg>
        </div>
      </div>
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          <div className="p-2 border-b border-gray-200">
            <input className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Cari..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onClick={(e) => e.stopPropagation()} />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length ? filteredOptions.map(opt => (
              <div key={opt.value} className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm" onClick={() => { onChange(opt.value); setIsOpen(false); setSearchTerm(''); }}>{opt.label}</div>
            )) : <div className="px-3 py-2 text-gray-500 text-sm">Tidak ada hasil</div>}
          </div>
        </div>
      )}
    </div>
  );
};

const LogbookHarianChiefForm = () => {
  const navigate = useNavigate();
  const query = useQuery();
  const { id } = useParams();
  const { auth } = useAuth();
  const lokasi = query.get('lokasi') || '';
  const isEditMode = !!id;

  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    tanggal: '',
    regu: '',
    shift: '',
    lokasi: lokasi,
    pos: auth?.user?.pos || '',
    nama_yg_menyerahkan: '',
    ttd_yg_menyerahkan: '',
    nama_yg_menerima: '',
    ttd_yg_menerima: '',
    nama_chief: '',
    ttd_chief: '',
    status: 'Draft'
  });
  const [uraianTugas, setUraianTugas] = useState([{ jam_mulai: '', jam_akhir: '', uraian_tugas: '', keterangan: '' }]);
  const [uraianInventaris, setUraianInventaris] = useState([{ nama_inventaris: '', jumlah: '', keterangan: '' }]);
  const [existingTugasIds, setExistingTugasIds] = useState([]);
  const [existingInventarisIds, setExistingInventarisIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    axiosInstance.get('/api/users').then(res => setUsers(res.data)).catch(() => {});
  }, []);

  // Set pos from current user for create mode
  useEffect(() => {
    if (!isEditMode && auth?.user?.pos) {
      setFormData(prev => ({
        ...prev,
        pos: auth.user.pos
      }));
    }
  }, [isEditMode, auth?.user?.pos]);

  // Fetch edit data first if in edit mode
  useEffect(() => {
    if (!isEditMode || !id) return;
    (async () => {
      try {
        const resp = await axiosInstance.get(`/api/logbook-harian-master/detail/${id}`);
        const d = resp.data;
        setFormData(prev => ({
          ...prev,
          tanggal: d.tanggal || prev.tanggal,
          regu: d.regu || prev.regu,
          shift: d.shift || prev.shift,
          lokasi: d.lokasi || prev.lokasi,
          nama_yg_menyerahkan: d.nama_yg_menyerahkan || prev.nama_yg_menyerahkan,
          ttd_yg_menyerahkan: d.ttd_yg_menyerahkan || '',
          nama_yg_menerima: d.nama_yg_menerima || prev.nama_yg_menerima,
          ttd_yg_menerima: d.ttd_yg_menerima || '',
          nama_chief: d.nama_chief || prev.nama_chief,
          ttd_chief: d.ttd_chief || '',
          status: d.status || 'Draft'
        }));
        if (Array.isArray(d.uraian_tugas_list)) {
          setUraianTugas(d.uraian_tugas_list.map(t => ({
            id: t.id,
            jam_mulai: t.jam_mulai || '',
            jam_akhir: t.jam_akhir || '',
            uraian_tugas: t.uraian_tugas || '',
            keterangan: t.keterangan || ''
          })));
          setExistingTugasIds(d.uraian_tugas_list.map(t => t.id));
        }
                 if (Array.isArray(d.uraian_inventaris_list)) {
           setUraianInventaris(d.uraian_inventaris_list.map(v => ({
             id: v.id,
             nama_inventaris: v.nama_inventaris || '',
             jumlah: v.jumlah || '',
             keterangan: v.keterangan || ''
           })));
           setExistingInventarisIds(d.uraian_inventaris_list.map(v => v.id));
         }
      } catch (e) {}
    })();
  }, [isEditMode, id]);

  // Initialize chief form: sender and receiver are chiefs at same lokasi
  useEffect(() => {
    if (!auth?.user) return;
    const me = auth.user;
    // Use lokasi field instead of pos for chief
    const sameLokasiChiefs = users.filter(u => u.role === 'chief' && u.lokasi === me.lokasi);
    setFormData(prev => ({
      ...prev,
      tanggal: prev.tanggal || new Date().toISOString().split('T')[0],
      regu: prev.regu || me.regu || '',
      shift: prev.shift || me.shift || '',
      lokasi: prev.lokasi || lokasi || me.lokasi || '',
      nama_yg_menyerahkan: prev.nama_yg_menyerahkan || me.nama_lengkap,
      nama_yg_menerima: prev.nama_yg_menerima || sameLokasiChiefs.find(c => c.nama_lengkap !== me.nama_lengkap)?.nama_lengkap || '',
      nama_chief: prev.nama_chief || me.nama_lengkap
    }));
  }, [auth?.user, users, lokasi]);

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const removeTugas = async (index) => {
    if (uraianTugas.length > 1) {
      const result = await Swal.fire({
        title: 'Konfirmasi',
        text: 'Apakah Anda yakin ingin menghapus tugas ini?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Ya, Hapus',
        cancelButtonText: 'Batal'
      });

      if (result.isConfirmed) {
        const newTugas = [...uraianTugas];
        newTugas.splice(index, 1);
        setUraianTugas(newTugas);
      }
    }
  };

  const removeInventaris = async (index) => {
    if (uraianInventaris.length > 1) {
      const result = await Swal.fire({
        title: 'Konfirmasi',
        text: 'Apakah Anda yakin ingin menghapus inventaris ini?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Ya, Hapus',
        cancelButtonText: 'Batal'
      });

      if (result.isConfirmed) {
        const newInventaris = [...uraianInventaris];
        newInventaris.splice(index, 1);
        setUraianInventaris(newInventaris);
      }
    }
  };

  const isRowEmpty = (row, type) => {
    if (type === 'tugas') {
      return !row.uraian_tugas?.trim();
    } else if (type === 'inventaris') {
      return !row.nama_inventaris?.trim();
    }
    return true;
  };

  const officerOptions = users.filter(u => {
    if (u.role !== 'chief' || u.lokasi !== (auth?.user?.lokasi || '')) return false;
    
    // If editing and this user is already selected as nama_yg_menerima, include them
    if (isEditMode && u.nama_lengkap === formData.nama_yg_menerima) return true;
    
    // Otherwise, filter out current user
    return u.nama_lengkap !== auth?.user?.nama_lengkap;
  }).map(u => ({ value: u.nama_lengkap, label: u.nama_lengkap }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate that at least one task is filled
    const hasValidTugas = uraianTugas.some(t => t.uraian_tugas.trim());
    if (!hasValidTugas) {
      Swal.fire({
        icon: 'warning',
        title: 'Peringatan',
        text: 'Harap isi minimal satu uraian tugas',
        confirmButtonColor: '#3085d6',
      });
      return;
    }

    // Validate regu field if sending to chief (but not required for save/update)
    if (formData.status === 'Submitted' && !formData.regu.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Peringatan',
        text: 'Harap isi field Regu sebelum mengirim ke Chief',
        confirmButtonColor: '#3085d6',
      });
      return;
    }
    
    setLoading(true);
    try {
      if (isEditMode) {
        console.log('Starting edit mode update...');
        
        // 1. Update existing logbook
        console.log('Updating main logbook...');
        const logbookResponse = await axiosInstance.put(`/api/logbook-harian-master/${id}`, formData);
        console.log('Logbook updated successfully:', logbookResponse.data);
        
        // 2. Handle uraian tugas: update existing, add new
        console.log('Processing uraian tugas...');
        
        // Filter out empty tugas rows
        const validTugas = uraianTugas.filter(t => t.uraian_tugas.trim());
        
        // Get current tugas IDs from the form
        const currentTugasIds = validTugas.filter(t => t.id).map(t => t.id);
        
        // Delete tugas that are no longer in the form
        for (const existingId of existingTugasIds) {
          if (!currentTugasIds.includes(existingId)) {
            console.log(`Deleting tugas ID: ${existingId}`);
            await axiosInstance.delete(`/api/logbook-harian-master/uraian-tugas/${existingId}`);
          }
        }
        
        // Update existing and create new uraian tugas
        for (const tugas of validTugas) {
          if (tugas.id) {
            // Update existing record
            console.log(`Updating existing tugas ID: ${tugas.id}`);
            await axiosInstance.put(`/api/logbook-harian-master/uraian-tugas/${tugas.id}`, {
              jam_mulai: tugas.jam_mulai,
              jam_akhir: tugas.jam_akhir,
              uraian_tugas: tugas.uraian_tugas,
              keterangan: tugas.keterangan
            });
          } else if (tugas.uraian_tugas.trim()) {
            // Create new record
            console.log('Creating new tugas record');
            await axiosInstance.post('/api/logbook-harian-master/uraian-tugas/', {
              jam_mulai: tugas.jam_mulai,
              jam_akhir: tugas.jam_akhir,
              uraian_tugas: tugas.uraian_tugas,
              keterangan: tugas.keterangan,
              logbook_harian_master_id: id,
            });
          }
        }

        // 3. Handle uraian inventaris: update existing, add new
        console.log('Processing uraian inventaris...');
        
        // Filter out empty inventaris rows
        const validInventaris = uraianInventaris.filter(v => v.nama_inventaris.trim());
        
        // Get current inventaris IDs from the form
        const currentInventarisIds = validInventaris.filter(v => v.id).map(v => v.id);
        
        // Delete inventaris that are no longer in the form
        for (const existingId of existingInventarisIds) {
          if (!currentInventarisIds.includes(existingId)) {
            console.log(`Deleting inventaris ID: ${existingId}`);
            await axiosInstance.delete(`/api/logbook-harian-master/uraian-inventaris/${existingId}`);
          }
        }
        
        // Update existing and create new uraian inventaris
        for (const inventaris of validInventaris) {
          if (inventaris.id) {
            // Update existing record
            console.log(`Updating existing inventaris ID: ${inventaris.id}`);
                         await axiosInstance.put(`/api/logbook-harian-master/uraian-inventaris/${inventaris.id}`, {
               nama_inventaris: inventaris.nama_inventaris,
               jumlah: inventaris.jumlah,
               keterangan: inventaris.keterangan
             });
          } else if (inventaris.nama_inventaris.trim()) {
            // Create new record
            console.log('Creating new inventaris record');
                         await axiosInstance.post('/api/logbook-harian-master/uraian-inventaris/', {
               nama_inventaris: inventaris.nama_inventaris,
               jumlah: inventaris.jumlah,
               keterangan: inventaris.keterangan,
               logbook_harian_master_id: id,
             });
          }
        }
        
        console.log('All updates completed successfully');
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: 'Logbook berhasil diperbarui!',
          confirmButtonColor: '#3085d6',
        });
      } else {
        const res = await axiosInstance.post('/api/logbook-harian-master/', formData);
        const masterId = res.data.id;
        
        // Filter out empty rows for create mode
        const validTugas = uraianTugas.filter(t => t.uraian_tugas?.trim());
        const validInventaris = uraianInventaris.filter(v => v.nama_inventaris?.trim());
        
        for (const t of validTugas) {
          await axiosInstance.post('/api/logbook-harian-master/uraian-tugas/', { ...t, logbook_harian_master_id: masterId });
        }
        for (const v of validInventaris) {
          await axiosInstance.post('/api/logbook-harian-master/uraian-inventaris/', { ...v, logbook_harian_master_id: masterId });
        }
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: 'Logbook berhasil dibuat!',
          confirmButtonColor: '#3085d6',
        });
      }
      navigate(`/forms/masters/logbook-chief?lokasi=${encodeURIComponent(formData.lokasi)}`);
    } catch (error) {
      console.error('Error saving logbook:', error);
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: 'Gagal menyimpan logbook. Silakan coba lagi.',
        confirmButtonColor: '#d33',
      });
    } finally { 
      setLoading(false); 
    }
  };

  const handleComplete = async () => {
    // Validate required fields before completing
    if (!formData.regu.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Peringatan',
        text: 'Field Regu wajib diisi sebelum menyelesaikan logbook',
        confirmButtonColor: '#3085d6',
      });
      return;
    }

    if (!formData.ttd_yg_menyerahkan) {
      Swal.fire({
        icon: 'warning',
        title: 'Peringatan',
        text: 'Tanda tangan yang menyerahkan wajib diisi sebelum menyelesaikan logbook',
        confirmButtonColor: '#3085d6',
      });
      return;
    }

    if (!formData.ttd_yg_menerima) {
      Swal.fire({
        icon: 'warning',
        title: 'Peringatan',
        text: 'Tanda tangan yang menerima wajib diisi sebelum menyelesaikan logbook',
        confirmButtonColor: '#3085d6',
      });
      return;
    }

    setCompleting(true);
    try {
      // Update the logbook with completed status
      await axiosInstance.put(`/api/logbook-harian-master/${id}`, {
        ...formData,
        status: 'Completed'
      });
      
      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Logbook berhasil diselesaikan!',
        confirmButtonColor: '#3085d6',
      });
      navigate(`/forms/masters/logbook-chief?lokasi=${encodeURIComponent(formData.lokasi)}`);
    } catch (err) {
      console.error('Error completing logbook:', err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: 'Gagal menyelesaikan logbook',
        confirmButtonColor: '#d33',
      });
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="w-full h-full">
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 h-full">
          <div className="flex items-center justify-between mb-6">
            <button
              type="button"
              className="text-blue-600 hover:underline flex items-center"
              onClick={() => navigate(`/forms/masters/logbook-chief?lokasi=${encodeURIComponent(formData.lokasi)}`)}
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Kembali
            </button>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              {isEditMode ? 'Edit Logbook Harian Chief' : 'Buat Logbook Harian Chief'}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 h-full">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal</label>
                <input 
                  type="date" 
                  className="w-full border border-gray-300 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                  value={formData.tanggal} 
                  onChange={e => handleChange('tanggal', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Regu</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                  value={formData.regu} 
                  onChange={e => handleChange('regu', e.target.value)}
                  required
                >
                  <option value="">Pilih Regu</option>
                  <option value="Regu A">Regu A</option>
                  <option value="Regu B">Regu B</option>
                  <option value="Regu C">Regu C</option>
                  <option value="Regu D">Regu D</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Shift</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                  value={formData.shift} 
                  onChange={e => handleChange('shift', e.target.value)}
                  required
                >
                  <option value="">Pilih Shift</option>
                  <option value="Pagi (07:00 - 13:00)">Pagi (07:00 - 13:00)</option>
                  <option value="Siang (13:00 - 19:00)">Siang (13:00 - 19:00)</option>
                  <option value="Malam (19:00 - 07:00)">Malam (19:00 - 07:00)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pos</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded-lg px-2 py-2 bg-gray-100 text-sm" 
                  value={formData.lokasi} 
                  readOnly 
                />
              </div>
            </div>

            {/* Hidden input for pos */}
            <input 
              type="hidden" 
              name="pos" 
              value={formData.pos}
            />

            {/* Uraian Tugas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">Uraian Tugas</label>
              <div className="border border-gray-200 rounded-lg">
                <div className="divide-y divide-gray-200">
                  {uraianTugas.map((row, idx) => (
                    <div key={idx} className="flex gap-3 items-start p-3 sm:p-4">
                      {/* Number - hidden on mobile */}
                      <span className="hidden sm:block w-6 sm:w-8 text-center text-gray-500 font-medium pt-2 text-sm">{idx + 1}</span>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-8 gap-2 sm:gap-3 flex-1">
                        {/* Mobile: Jam Mulai and Jam Selesai side by side, Desktop: separate columns */}
                        <div className="sm:col-span-1 lg:col-span-1">
                          <label className="block text-xs text-gray-600 mb-1">Jam Mulai</label>
                          <input 
                            type="time" 
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" 
                            value={row.jam_mulai} 
                            onChange={e => { const n=[...uraianTugas]; n[idx].jam_mulai=e.target.value; setUraianTugas(n); }} 
                            required
                          />
                        </div>
                        <div className="sm:col-span-1 lg:col-span-1">
                          <label className="block text-xs text-gray-600 mb-1">Jam Selesai</label>
                          <input 
                            type="time" 
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" 
                            value={row.jam_akhir} 
                            onChange={e => { const n=[...uraianTugas]; n[idx].jam_akhir=e.target.value; setUraianTugas(n); }} 
                            required
                          />
                        </div>
                        <div className="col-span-2 sm:col-span-2 lg:col-span-4">
                          <label className="block text-xs text-gray-600 mb-1">Uraian Tugas</label>
                          <textarea
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                            rows={1}
                            value={row.uraian_tugas}
                            onChange={e => {
                              const n=[...uraianTugas];
                              n[idx].uraian_tugas=e.target.value;
                              setUraianTugas(n);
                              // Auto-grow height
                              e.target.style.height = 'auto';
                              e.target.style.height = `${e.target.scrollHeight}px`;
                            }}
                            onInput={e => {
                              e.target.style.height = 'auto';
                              e.target.style.height = `${e.target.scrollHeight}px`;
                            }}
                            required
                          />
                        </div>
                        <div className="col-span-2 sm:col-span-2 lg:col-span-2">
                          <label className="block text-xs text-gray-600 mb-1">Keterangan</label>
                          <input 
                            type="text" 
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" 
                            value={row.keterangan} 
                            onChange={e => { const n=[...uraianTugas]; n[idx].keterangan=e.target.value; setUraianTugas(n); }} 
                          />
                        </div>
                      </div>
                      {uraianTugas.length > 1 && (
                        <button 
                          type="button" 
                          className="text-red-500 hover:text-red-700 mt-2 sm:mt-6" 
                          onClick={() => removeTugas(idx)}
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <button 
                type="button" 
                className="mt-3 text-blue-600 font-medium hover:text-blue-700" 
                onClick={() => setUraianTugas([...uraianTugas, { jam_mulai: '', jam_akhir: '', uraian_tugas: '', keterangan: '' }])}
              >
                + Tambah Tugas
              </button>
            </div>

                         {/* Uraian Inventaris */}
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-4">Uraian Inventaris</label>
               <div className="border border-gray-200 rounded-lg">
                 <div className="divide-y divide-gray-200">
                   {uraianInventaris.map((row, idx) => (
                     <div key={idx}>
                       {/* Desktop: All fields in one row */}
                       <div className="hidden md:flex gap-3 items-center p-3 sm:p-4">
                         {/* Number - hidden on mobile */}
                         <span className="hidden sm:block w-8 text-center text-gray-500 font-medium text-sm">{idx + 1}</span>
                         
                         {/* Nama Inventaris */}
                         <div className="flex-1">
                           <label className="block text-xs text-gray-600 mb-1">Nama Inventaris</label>
                           <input 
                             type="text" 
                             className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" 
                             value={row.nama_inventaris} 
                             onChange={e => { const n=[...uraianInventaris]; n[idx].nama_inventaris=e.target.value; setUraianInventaris(n); }}  
                           />
                         </div>
                         
                         {/* Keterangan */}
                         <div className="w-40">
                           <label className="block text-xs text-gray-600 mb-1">Keterangan</label>
                           <input 
                             type="text" 
                             className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" 
                             value={row.keterangan} 
                             onChange={e => { const n=[...uraianInventaris]; n[idx].keterangan=e.target.value; setUraianInventaris(n); }} 
                           />
                         </div>
                         
                         {/* Jumlah */}
                         <div className="w-20">
                           <label className="block text-xs text-gray-600 mb-1">Jumlah</label>
                           <input 
                             type="number" 
                             className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" 
                             value={row.jumlah} 
                             onChange={e => { const n=[...uraianInventaris]; n[idx].jumlah=e.target.value; setUraianInventaris(n); }} 
                           />
                         </div>
                         
                         {/* Delete button */}
                         {uraianInventaris.length > 1 && (
                           <button 
                             type="button" 
                             className="text-red-500 hover:text-red-700" 
                             onClick={() => removeInventaris(idx)}
                           >
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1 1v3M4 7h16" />
                             </svg>
                           </button>
                         )}
                       </div>
                       
                       {/* Mobile: Split into two rows */}
                       <div className="md:hidden">
                         {/* First row: Nama Inventaris */}
                         <div className="flex gap-3 items-center p-3 sm:p-4">
                           <div className="flex-1">
                             <label className="block text-xs text-gray-600 mb-1">Nama Inventaris</label>
                             <input 
                               type="text" 
                               className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" 
                               value={row.nama_inventaris} 
                               onChange={e => { const n=[...uraianInventaris]; n[idx].nama_inventaris=e.target.value; setUraianInventaris(n); }}  
                             />
                           </div>
                           {uraianInventaris.length > 1 && (
                             <button 
                               type="button" 
                               className="text-red-500 hover:text-red-700" 
                               onClick={() => removeInventaris(idx)}
                             >
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1 1v3M4 7h16" />
                               </svg>
                             </button>
                           )}
                         </div>
                         
                         {/* Second row: Keterangan and Jumlah */}
                         <div className="flex gap-3 items-center px-3 sm:px-4 pb-3 sm:pb-4">
                           <div className="flex-1">
                             <label className="block text-xs text-gray-600 mb-1">Keterangan</label>
                             <input 
                               type="text" 
                               className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" 
                               value={row.keterangan} 
                               onChange={e => { const n=[...uraianInventaris]; n[idx].keterangan=e.target.value; setUraianInventaris(n); }} 
                             />
                           </div>
                           <div className="w-20">
                             <label className="block text-xs text-gray-600 mb-1">Jumlah</label>
                             <input 
                               type="number" 
                               className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" 
                               value={row.jumlah} 
                               onChange={e => { const n=[...uraianInventaris]; n[idx].jumlah=e.target.value; setUraianInventaris(n); }} 
                             />
                           </div>
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
               <button 
                 type="button" 
                 className="mt-3 text-blue-600 font-medium hover:text-blue-700" 
                 onClick={() => setUraianInventaris([...uraianInventaris, { nama_inventaris: '', jumlah: '', keterangan: '' }])}
               >
                 + Tambah Inventaris
               </button>
             </div>

            {/* Signatures */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 items-stretch">
              {/* Yang Menyerahkan */}
              <div className="flex flex-col h-full min-h-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">Yang Menyerahkan (Chief)</label>
                <div className="flex-1 flex flex-col justify-start">
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 mb-3 h-10 flex items-center" 
                    value={formData.nama_yg_menyerahkan} 
                    readOnly 
                  />
                  <div className="flex-1 min-h-[160px]">
                    <SignaturePad
                      onSignatureChange={(sig) => handleChange('ttd_yg_menyerahkan', sig)}
                      defaultValue={formData.ttd_yg_menyerahkan}
                      placeholder="Tanda tangan yang menyerahkan"
                    />
                  </div>
                </div>
              </div>

              {/* Yang Menerima */}
              <div className="flex flex-col h-full min-h-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">Yang Menerima (Chief)</label>
                <div className="flex-1 flex flex-col justify-start">
                  <SearchableDropdown
                    options={officerOptions}
                    value={formData.nama_yg_menerima}
                    onChange={(v) => handleChange('nama_yg_menerima', v)}
                    placeholder="Pilih chief penerima"
                    required={false}
                    className="mb-3"
                  />
                  <div className="flex-1 min-h-[160px]">
                    <SignaturePad
                      onSignatureChange={(sig) => handleChange('ttd_yg_menerima', sig)}
                      defaultValue={formData.ttd_yg_menerima}
                      placeholder="Tanda tangan yang menerima"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200">
              {isEditMode && formData.status !== 'Completed' && (
                <button 
                  type="button" 
                  onClick={handleComplete}
                  className="w-full sm:w-auto bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium disabled:opacity-50" 
                  disabled={completing}
                >
                  {completing ? 'Menyelesaikan...' : 'Selesaikan'}
                </button>
              )}
              <button 
                type="submit" 
                className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50" 
                disabled={loading}
              >
                {loading ? 'Menyimpan...' : (isEditMode ? 'Update Logbook' : 'Simpan Logbook')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LogbookHarianChiefForm;


