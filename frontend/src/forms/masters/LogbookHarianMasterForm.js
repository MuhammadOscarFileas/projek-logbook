import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../auth/useAuth';
import SignaturePad from '../../components/SignaturePad';
import Swal from 'sweetalert2';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

// Searchable Dropdown Component
const SearchableDropdown = ({ 
  options, 
  value, 
  onChange, 
  placeholder, 
  required = false,
  className = "",
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);

  useEffect(() => {
    const filtered = options.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredOptions(filtered);
  }, [searchTerm, options]);

  const handleSelect = (option) => {
    onChange(option.value);
    setSearchTerm('');
    setIsOpen(false);
  };

  const selectedOption = options.find(option => option.value === value);

  return (
    <div className={`relative ${className}`}>
      <div
        className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 h-10 flex items-center ${
          disabled ? 'cursor-not-allowed bg-gray-100' : 'cursor-pointer bg-white'
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex justify-between items-center">
          <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7 7" />
          </svg>
        </div>
      </div>
      
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              placeholder="Cari..."
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                  onClick={() => handleSelect(option)}
                >
                  {option.label}
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-gray-500 text-sm">Tidak ada hasil</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const LogbookHarianMasterForm = ({ previewMode = false }) => {
  const navigate = useNavigate();
  const query = useQuery();
  const { id } = useParams(); // Get ID from URL for edit mode
  const lokasi = query.get('lokasi') || '';
  const { auth } = useAuth();
  const isEditMode = !!id;
  const isPreviewMode = previewMode;
  const isChief = auth?.user?.role === 'chief';
  const isOfficer = auth?.user?.role === 'officer';

  // Form state
  const [formData, setFormData] = useState({
    tanggal: '',
    regu: '',
    shift: '',
    lokasi: '',
    bandara: '',
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

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(isEditMode);
  const [error, setError] = useState(null);

  // Load users for dropdowns
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await axiosInstance.get('/api/users');
        setUsers(response.data.filter(user => user.role === 'officer' || user.role === 'chief' || user.role === 'assistant_chief'));
      } catch (err) {
        console.error('Failed to load users:', err);
      }
    };
    loadUsers();
  }, []);

  // Auto-fill chief based on officer's pos and shift
  useEffect(() => {
    if (auth?.user && users.length > 0 && isOfficer) {
      const currentUser = auth.user;
      
      // Auto-fill chief
      const matchingChiefs = users.filter(user => 
        user.role === 'chief' && 
        user.pos === currentUser.pos && 
        user.shift === currentUser.shift
      );
      
      if (matchingChiefs.length > 0 && !formData.nama_chief) {
        // Auto-fill with the first matching chief
        setFormData(prev => ({
          ...prev,
          nama_chief: matchingChiefs[0].nama_lengkap
        }));
      }
    }
  }, [auth?.user, users, formData.nama_chief, isOfficer]);

  // Auto-fill date, shift, and lokasi for new logbook creation
  useEffect(() => {
    if (!isEditMode && !isPreviewMode && auth?.user && !isChief) {
      // Set current date
      const today = new Date().toISOString().split('T')[0];
      
      // Set user's shift
      const userShift = auth.user.shift;
      
      setFormData(prev => ({
        ...prev,
        tanggal: today,
        shift: userShift || '',
        lokasi: lokasi || '', // Set lokasi from query parameter
        bandara: auth.user.bandara || ''
      }));
    }
  }, [isEditMode, isPreviewMode, auth?.user, isChief, lokasi]);

  // Validate and reset nama_yg_menerima if pos doesn't match
  useEffect(() => {
    if (formData.nama_yg_menerima && users.length > 0 && auth?.user?.pos) {
      const selectedUser = users.find(user => user.nama_lengkap === formData.nama_yg_menerima);
      
      // If selected user doesn't have the same pos, reset the field
      if (selectedUser && selectedUser.pos !== auth.user.pos) {
        setFormData(prev => ({
          ...prev,
          nama_yg_menerima: '',
          ttd_yg_menerima: ''
        }));
        
        // Show warning to user
        if (isEditMode) {
          Swal.fire({
            title: 'Perhatian',
            text: `Nama yang menerima "${selectedUser.nama_lengkap}" tidak memiliki pos yang sama dengan Anda. Field telah direset.`,
            icon: 'warning',
            confirmButtonText: 'OK'
          });
        }
      }
    }
  }, [formData.nama_yg_menerima, users, auth?.user?.pos, isEditMode]);

  // Validate and reset nama_chief if pos doesn't match
  useEffect(() => {
    if (formData.nama_chief && users.length > 0 && auth?.user?.pos) {
      const selectedUser = users.find(user => user.nama_lengkap === formData.nama_chief);
      
      // If selected user doesn't have the same pos, reset the field
      if (selectedUser && selectedUser.pos !== auth.user.pos) {
        setFormData(prev => ({
          ...prev,
          nama_chief: '',
          ttd_chief: ''
        }));
        
        // Show warning to user
        if (isEditMode) {
          Swal.fire({
            title: 'Perhatian',
            text: `Assistant Chief "${selectedUser.nama_lengkap}" tidak memiliki pos yang sama dengan Anda. Field telah direset.`,
            icon: 'warning',
            confirmButtonText: 'OK'
          });
        }
      }
    }
  }, [formData.nama_chief, users, auth?.user?.pos, isEditMode]);

  // Load existing data for edit mode
  useEffect(() => {
    if (isEditMode && id) {
      const loadLogbookData = async () => {
        try {
          setDataLoading(true);
          const response = await axiosInstance.get(`/api/logbook-harian-master/detail/${id}`);
          const logbookData = response.data;
          
          setFormData({
            tanggal: logbookData.tanggal || '',
            regu: logbookData.regu || '',
            shift: logbookData.shift || '',
            lokasi: logbookData.lokasi || lokasi,
          bandara: logbookData.bandara || auth?.user?.bandara || '',
            nama_yg_menyerahkan: logbookData.nama_yg_menyerahkan || '',
            ttd_yg_menyerahkan: logbookData.ttd_yg_menyerahkan || '',
            nama_yg_menerima: logbookData.nama_yg_menerima || '',
            ttd_yg_menerima: logbookData.ttd_yg_menerima || '',
            nama_chief: logbookData.nama_chief || '',
            ttd_chief: logbookData.ttd_chief || '',
            status: logbookData.status || 'Draft'
          });

          // Load uraian tugas from the detail response
          if (logbookData.uraian_tugas_list && logbookData.uraian_tugas_list.length > 0) {
            setUraianTugas(logbookData.uraian_tugas_list.map(tugas => ({
              id: tugas.id, // Assuming 'id' is available in the response
              jam_mulai: tugas.jam_mulai || '',
              jam_akhir: tugas.jam_akhir || '',
              uraian_tugas: tugas.uraian_tugas || '',
              keterangan: tugas.keterangan || ''
            })));
            setExistingTugasIds(logbookData.uraian_tugas_list.map(tugas => tugas.id));
          } else {
            setUraianTugas([{ jam_mulai: '', jam_akhir: '', uraian_tugas: '', keterangan: '' }]);
            setExistingTugasIds([]);
          }

          // Load uraian inventaris from the detail response
          if (logbookData.uraian_inventaris_list && logbookData.uraian_inventaris_list.length > 0) {
            setUraianInventaris(logbookData.uraian_inventaris_list.map(inv => ({
              id: inv.id, // Assuming 'id' is available in the response
              nama_inventaris: inv.nama_inventaris || '',
              jumlah: inv.jumlah || '',
              keterangan: inv.keterangan || ''
            })));
            setExistingInventarisIds(logbookData.uraian_inventaris_list.map(inv => inv.id));
          } else {
            setUraianInventaris([{ nama_inventaris: '', jumlah: '', keterangan: '' }]);
            setExistingInventarisIds([]);
          }
        } catch (err) {
          setError('Gagal memuat data logbook');
          console.error('Failed to load logbook data:', err);
        } finally {
          setDataLoading(false);
        }
      };
      loadLogbookData();
    } else if (!isEditMode && !isPreviewMode && !isChief) {
      // Set nama_yg_menyerahkan, pos, and lokasi from current user for create mode
      if (auth?.user?.nama_lengkap) {
        setFormData(prev => ({
          ...prev,
          nama_yg_menyerahkan: auth.user.nama_lengkap,
          pos: auth.user.pos || '',
          lokasi: lokasi || '' // Set lokasi from query parameter
        }));
      }
    }
  }, [id, isEditMode, isPreviewMode, auth, lokasi, isChief]);

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddTugas = () => {
    setUraianTugas([...uraianTugas, { jam_mulai: '', jam_akhir: '', uraian_tugas: '', keterangan: '' }]);
  };

  const handleTugasChange = (idx, field, value) => {
    const newTugas = [...uraianTugas];
    newTugas[idx][field] = value;
    setUraianTugas(newTugas);
  };

  const handleRemoveTugas = async (idx) => {
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

    if (!result.isConfirmed) {
      return;
    }

    const removedTugas = uraianTugas[idx];
    if (removedTugas.id) {
      // If it's an existing record, delete it immediately from the backend
      try {
        await axiosInstance.delete(`/api/logbook-harian-master/uraian-tugas/${removedTugas.id}`);
        console.log(`Deleted tugas ID: ${removedTugas.id}`);
      } catch (err) {
        console.error('Failed to delete tugas:', err);
        setError('Gagal menghapus uraian tugas');
      }
    }
    setUraianTugas(uraianTugas.filter((_, i) => i !== idx));
  };

  const handleAddInventaris = () => {
    setUraianInventaris([...uraianInventaris, { nama_inventaris: '', jumlah: '', keterangan: '' }]);
  };

  const handleInventarisChange = (idx, field, value) => {
    const newInv = [...uraianInventaris];
    newInv[idx][field] = value;
    setUraianInventaris(newInv);
  };

  const handleRemoveInventaris = async (idx) => {
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

    if (!result.isConfirmed) {
      return;
    }

    const removedInventaris = uraianInventaris[idx];
    if (removedInventaris.id) {
      // If it's an existing record, delete it immediately from the backend
      try {
        await axiosInstance.delete(`/api/logbook-harian-master/uraian-inventaris/${removedInventaris.id}`);
        console.log(`Deleted inventaris ID: ${removedInventaris.id}`);
      } catch (err) {
        console.error('Failed to delete inventaris:', err);
        setError('Gagal menghapus uraian inventaris');
      }
    }
    setUraianInventaris(uraianInventaris.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields (removed signature validation for officers)
    // Removed nama_yg_menerima validation - now optional when saving

    // Validate chief selection for officers
    if (isOfficer && !formData.nama_chief) {
      setError('Chief harus dipilih sebelum menyimpan logbook');
      return;
    }

    // Validate regu field if sending to chief (but not required for save/update)
    if (formData.status === 'Submitted' && !formData.regu.trim()) {
      setError('Harap isi field Regu sebelum submit');
      return;
    }

    // Show confirmation dialog
    const result = await Swal.fire({
      title: 'Konfirmasi',
      text: `Apakah Anda yakin ingin ${isEditMode ? 'mengupdate' : 'menyimpan'} logbook ini?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: `Ya, ${isEditMode ? 'Update' : 'Simpan'}`,
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isEditMode) {
        console.log('Starting edit mode update...');
        
        // 1. Update existing logbook
        console.log('Updating main logbook...');
        const logbookResponse = await axiosInstance.put(`/api/logbook-harian-master/${id}`, formData);
        console.log('Logbook updated successfully:', logbookResponse.data);
        
        // 2. Handle uraian tugas: update existing, add new
        console.log('Processing uraian tugas...');
        
        // Update existing and create new uraian tugas
        for (const tugas of uraianTugas) {
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
        
        // Update existing and create new uraian inventaris
        for (const inv of uraianInventaris) {
          if (inv.id) {
            // Update existing record
            console.log(`Updating existing inventaris ID: ${inv.id}`);
            await axiosInstance.put(`/api/logbook-harian-master/uraian-inventaris/${inv.id}`, {
              nama_inventaris: inv.nama_inventaris,
              jumlah: inv.jumlah,
              keterangan: inv.keterangan
            });
          } else if (inv.nama_inventaris.trim()) {
            // Create new record
            console.log('Creating new inventaris record');
            await axiosInstance.post('/api/logbook-harian-master/uraian-inventaris/', {
              nama_inventaris: inv.nama_inventaris,
              jumlah: inv.jumlah,
              keterangan: inv.keterangan,
              logbook_harian_master_id: id,
            });
          }
        }
        
        console.log('All updates completed successfully');
      } else {
        console.log('Starting create mode...');
        // Create new logbook
        const res = await axiosInstance.post('/api/logbook-harian-master/', formData);
        const masterId = res.data.id;
        console.log('New logbook created with ID:', masterId);

        // Create uraian tugas
        for (const tugas of uraianTugas) {
          if (tugas.uraian_tugas.trim()) { // Only save if uraian_tugas is not empty
            await axiosInstance.post('/api/logbook-harian-master/uraian-tugas/', {
              ...tugas,
              logbook_harian_master_id: masterId,
            });
          }
        }

        // Create uraian inventaris
        for (const inv of uraianInventaris) {
          if (inv.nama_inventaris.trim()) { // Only save if nama_inventaris is not empty
            await axiosInstance.post('/api/logbook-harian-master/uraian-inventaris/', {
              ...inv,
              logbook_harian_master_id: masterId,
            });
          }
        }
      }

      // Show success message
      await Swal.fire({
        title: 'Berhasil!',
        text: `Logbook berhasil ${isEditMode ? 'diupdate' : 'disimpan'}`,
        icon: 'success',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'OK'
      });

      // Navigate based on user role
      if (isChief) {
        navigate('/chief/belum-ditandatangani');
      } else {
        navigate(`/forms/masters/logbook-harian?lokasi=${encodeURIComponent(formData.lokasi)}`);
      }
    } catch (err) {
      console.error('Detailed error:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      
      // Show error message
      await Swal.fire({
        title: 'Error!',
        text: `Gagal ${isEditMode ? 'mengupdate' : 'menyimpan'} logbook: ${err.response?.data?.error || err.message}`,
        icon: 'error',
        confirmButtonColor: '#d33',
        confirmButtonText: 'OK'
      });
      
      setError(`Gagal ${isEditMode ? 'mengupdate' : 'menyimpan'} logbook: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitToSupervisor = async () => {
    // Validate required fields for submitting to chief (signatures required)
    if (!formData.nama_yg_menerima || !formData.ttd_yg_menyerahkan || !formData.ttd_yg_menerima) {
      setError('Nama yang menerima dan tanda tangan yang menyerahkan serta yang menerima wajib diisi sebelum submit');
      return;
    }

    // Validate regu field is required for submission
    if (!formData.regu.trim()) {
      setError('Field Regu wajib diisi sebelum submit');
      return;
    }

    // Validate chief selection for officers
    if (isOfficer && !formData.nama_chief) {
      setError('Chief harus dipilih sebelum mengirim ke chief');
      return;
    }

    // Show confirmation dialog
    const result = await Swal.fire({
      title: 'Konfirmasi',
      text: 'Apakah Anda yakin ingin submit logbook ini?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya, Submit',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Update status to submitted
      const updatedFormData = { ...formData, status: 'Submitted' };
      
      if (isEditMode) {
        console.log('Starting edit mode submit to supervisor...');
        
        // 1. Update existing logbook
        console.log('Updating main logbook with submitted status...');
        const logbookResponse = await axiosInstance.put(`/api/logbook-harian-master/${id}`, updatedFormData);
        console.log('Logbook updated successfully:', logbookResponse.data);
        
        // 2. Handle uraian tugas: update existing, add new
        console.log('Processing uraian tugas...');
        
        // Update existing and create new uraian tugas
        for (const tugas of uraianTugas) {
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
        
        // Update existing and create new uraian inventaris
        for (const inv of uraianInventaris) {
          if (inv.id) {
            // Update existing record
            console.log(`Updating existing inventaris ID: ${inv.id}`);
            await axiosInstance.put(`/api/logbook-harian-master/uraian-inventaris/${inv.id}`, {
              nama_inventaris: inv.nama_inventaris,
              jumlah: inv.jumlah,
              keterangan: inv.keterangan
            });
          } else if (inv.nama_inventaris.trim()) {
            // Create new record
            console.log('Creating new inventaris record');
            await axiosInstance.post('/api/logbook-harian-master/uraian-inventaris/', {
              nama_inventaris: inv.nama_inventaris,
              jumlah: inv.jumlah,
              keterangan: inv.keterangan,
              logbook_harian_master_id: id,
            });
          }
        }
        
        console.log('All updates completed successfully');
      } else {
        console.log('Starting create mode with submitted status...');
        // Create new logbook with submitted status
        const res = await axiosInstance.post('/api/logbook-harian-master/', updatedFormData);
        const masterId = res.data.id;
        console.log('New logbook created with ID:', masterId);

        // Create uraian tugas
        for (const tugas of uraianTugas) {
          if (tugas.uraian_tugas.trim()) { // Only save if uraian_tugas is not empty
            await axiosInstance.post('/api/logbook-harian-master/uraian-tugas/', {
              ...tugas,
              logbook_harian_master_id: masterId,
            });
          }
        }

        // Create uraian inventaris
        for (const inv of uraianInventaris) {
          if (inv.nama_inventaris.trim()) { // Only save if nama_inventaris is not empty
            await axiosInstance.post('/api/logbook-harian-master/uraian-inventaris/', {
              ...inv,
              logbook_harian_master_id: masterId,
            });
          }
        }
      }

      // Show success message
      await Swal.fire({
        title: 'Berhasil!',
        text: 'Logbook berhasil disubmit',
        icon: 'success',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'OK'
      });
      
      // Navigate based on user role
      if (isChief) {
        navigate('/chief/belum-ditandatangani');
      } else {
        navigate(`/forms/masters/logbook-harian?lokasi=${encodeURIComponent(formData.lokasi)}`);
      }
    } catch (err) {
      console.error('Detailed error:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      
      // Show error message
      await Swal.fire({
        title: 'Error!',
        text: `Gagal mengirim ke supervisor: ${err.response?.data?.error || err.message}`,
        icon: 'error',
        confirmButtonColor: '#d33',
        confirmButtonText: 'OK'
      });
      
      setError(`Gagal mengirim ke supervisor: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // New function for chief to complete the report
  const handleCompleteReport = async () => {
    setLoading(true);
    setError(null);

    try {
      // Update status to completed
      const updatedFormData = { ...formData, status: 'Completed' };
      
      console.log('Chief completing report...');
      const logbookResponse = await axiosInstance.put(`/api/logbook-harian-master/${id}`, updatedFormData);
      console.log('Report completed successfully:', logbookResponse.data);
      
      // Navigate back to unsigned reports
      navigate('/chief/belum-ditandatangani');
    } catch (err) {
      console.error('Error completing report:', err);
      setError(`Gagal menyelesaikan laporan: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="loader"></div>
          <p className="mt-4 text-gray-600">Memuat data logbook...</p>
        </div>
      </div>
    );
  }

  // Filter out current user from nama_yg_menerima dropdown and only show officers
  // But when editing existing reports, include the current user if they are already selected
  // Also filter by pos - only show users with the same pos as the logged-in user
  const availableOfficers = users.filter(user => {
    if (user.role !== 'officer') return false;
    
    // Only show users with the same pos as the logged-in user
    if (user.pos !== auth?.user?.pos) return false;
    
    // If editing and this user is already selected as nama_yg_menerima, include them
    if (isEditMode && user.nama_lengkap === formData.nama_yg_menerima) return true;
    
    // Otherwise, filter out current user
    return user.nama_lengkap !== auth?.user?.nama_lengkap;
  });
  
  // Filter only assistant chiefs for chief dropdown - officers can only select assistant chiefs
  // Also filter by pos - only show assistant chiefs with the same pos as the logged-in user
  const availableChiefs = users.filter(user => {
    if (user.role !== 'assistant_chief') return false;
    
    // Only show assistant chiefs with the same pos as the logged-in user
    return user.pos === auth?.user?.pos;
  });

  // Debug information (can be removed in production)
  console.log('Current user pos:', auth?.user?.pos);
  console.log('Available officers with same pos:', availableOfficers.length);
  console.log('Available assistant chiefs with same pos:', availableChiefs.length);

  // Convert to options format for SearchableDropdown
  const officerOptions = availableOfficers.map(user => ({
    value: user.nama_lengkap,
    label: `${user.nama_lengkap} (${user.pos})`
  }));

  const chiefOptions = availableChiefs.map(user => ({
    value: user.nama_lengkap,
    label: `${user.nama_lengkap} (${user.pos} - ${user.role === 'assistant_chief' ? 'Assistant Chief' : 'Chief'})`
  }));

  // Determine if form should be read-only
  const isReadOnly = isPreviewMode || isChief;

  // Determine navigation path based on user role and form status
  const getBackPath = () => {
    if (isChief) {
      // For chiefs, check if the report is completed or still pending
      if (formData.status === 'Completed' || (formData.ttd_chief && formData.ttd_chief !== '')) {
        // If completed or signed, go to signed reports
        return '/chief/laporan-sudah-ditandatangani';
      } else {
        // If not completed, go to unsigned reports
        return '/chief/belum-ditandatangani';
      }
    }
    return `/forms/masters/logbook-harian?lokasi=${encodeURIComponent(formData.lokasi)}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="w-full h-full">
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 h-full">
          <div className="flex items-center justify-between mb-6">
        <button
          type="button"
              className="text-blue-600 hover:underline flex items-center"
          onClick={() => navigate(getBackPath())}
        >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
          Kembali
        </button>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              {isPreviewMode ? 'Preview Logbook Harian' : isEditMode ? 'Edit Logbook Harian' : 'Buat Logbook Harian Baru'}
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
                  onChange={(e) => handleFormChange('tanggal', e.target.value)}
                  required
                  disabled={isReadOnly}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Regu</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                  value={formData.regu} 
                  onChange={(e) => handleFormChange('regu', e.target.value)}
                  disabled={isReadOnly}
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
                  onChange={(e) => handleFormChange('shift', e.target.value)}
                  required
                  disabled={isReadOnly}
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
            {/* Hidden bandara for officer */}
            <input
              type="hidden"
              name="bandara"
              value={formData.bandara}
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
                            onChange={e => handleTugasChange(idx, 'jam_mulai', e.target.value)} 
                            
                            disabled={isReadOnly}
                          />
                        </div>
                        <div className="sm:col-span-1 lg:col-span-1">
                          <label className="block text-xs text-gray-600 mb-1">Jam Selesai</label>
                          <input 
                            type="time" 
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" 
                            value={row.jam_akhir} 
                            onChange={e => handleTugasChange(idx, 'jam_akhir', e.target.value)} 
 
                            disabled={isReadOnly}
                          />
                        </div>
                        <div className="col-span-2 sm:col-span-2 lg:col-span-4">
                          <label className="block text-xs text-gray-600 mb-1">Uraian Tugas</label>
                          <textarea
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                            rows={1}
                            value={row.uraian_tugas}
                            onChange={e => {
                              handleTugasChange(idx, 'uraian_tugas', e.target.value);
                              // Auto-grow height
                              e.target.style.height = 'auto';
                              e.target.style.height = `${e.target.scrollHeight}px`;
                            }}
                            onInput={e => {
                              e.target.style.height = 'auto';
                              e.target.style.height = `${e.target.scrollHeight}px`;
                            }}
                            required
                            disabled={isReadOnly}
                          />
                        </div>
                        <div className="col-span-2 sm:col-span-2 lg:col-span-2">
                          <label className="block text-xs text-gray-600 mb-1">Keterangan</label>
                          <input 
                            type="text" 
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" 
                            value={row.keterangan} 
                            onChange={e => handleTugasChange(idx, 'keterangan', e.target.value)} 
                            disabled={isReadOnly}
                          />
                        </div>
                      </div>
                      {uraianTugas.length > 1 && !isReadOnly && (
                        <button 
                          type="button" 
                          className="text-red-500 hover:text-red-700 mt-2 sm:mt-6" 
                          onClick={() => handleRemoveTugas(idx)}
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
              {!isReadOnly && (
                <button 
                  type="button" 
                  className="mt-3 text-blue-600 font-medium hover:text-blue-700" 
                  onClick={handleAddTugas}
                >
                  + Tambah Tugas
                </button>
              )}
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
                            onChange={e => handleInventarisChange(idx, 'nama_inventaris', e.target.value)}  
                            disabled={isReadOnly}
                          />
                        </div>
                        
                        {/* Keterangan */}
                        <div className="w-40">
                          <label className="block text-xs text-gray-600 mb-1">Keterangan</label>
                          <input 
                            type="text" 
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" 
                            value={row.keterangan} 
                            onChange={e => handleInventarisChange(idx, 'keterangan', e.target.value)} 
                            disabled={isReadOnly}
                          />
                        </div>
                        
                        {/* Jumlah */}
                        <div className="w-20">
                          <label className="block text-xs text-gray-600 mb-1">Jumlah</label>
                          <input 
                            type="number" 
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" 
                            value={row.jumlah} 
                            onChange={e => handleInventarisChange(idx, 'jumlah', e.target.value)} 
                            disabled={isReadOnly}
                          />
                        </div>
                        
                        {/* Delete button */}
                        {uraianInventaris.length > 1 && !isReadOnly && (
                          <button 
                            type="button" 
                            className="text-red-500 hover:text-red-700" 
                            onClick={() => handleRemoveInventaris(idx)}
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
                              onChange={e => handleInventarisChange(idx, 'nama_inventaris', e.target.value)}  
                              disabled={isReadOnly}
                            />
                          </div>
                          {uraianInventaris.length > 1 && !isReadOnly && (
                            <button 
                              type="button" 
                              className="text-red-500 hover:text-red-700" 
                              onClick={() => handleRemoveInventaris(idx)}
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
                              onChange={e => handleInventarisChange(idx, 'keterangan', e.target.value)} 
                              disabled={isReadOnly}
                            />
                          </div>
                          <div className="w-20">
                            <label className="block text-xs text-gray-600 mb-1">Jumlah</label>
                            <input 
                              type="number" 
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" 
                              value={row.jumlah} 
                              onChange={e => handleInventarisChange(idx, 'jumlah', e.target.value)} 
                              disabled={isReadOnly}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
                {!isReadOnly && (
                  <button 
                    type="button" 
                    className="mt-3 text-blue-600 font-medium hover:text-blue-700" 
                    onClick={handleAddInventaris}
                  >
                    + Tambah Inventaris
                  </button>
                )}
              </div>
 
            {/* Signatures */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 items-stretch">
              {/* Menyerahkan */}
              <div className="flex flex-col h-full min-h-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">Yang Menyerahkan</label>
                <div className="flex-1 flex flex-col justify-start">
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 mb-3 h-10 flex items-center" 
                    value={formData.nama_yg_menyerahkan} 
                    readOnly 
                    disabled={isReadOnly}
                  />
                  <div className="flex-1 min-h-[160px]">
                    <SignaturePad
                      onSignatureChange={(signature) => handleFormChange('ttd_yg_menyerahkan', signature)}
                      defaultValue={formData.ttd_yg_menyerahkan}
                      placeholder="Tanda tangan yang menyerahkan"
                      disabled={isReadOnly}
                    />
                  </div>
                </div>
              </div>

              {/* Menerima */}
              <div className="flex flex-col h-full min-h-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">Yang Menerima</label>
                <div className="flex-1 flex flex-col justify-start">
                  <SearchableDropdown
                    options={officerOptions}
                    value={formData.nama_yg_menerima}
                    onChange={(v) => handleFormChange('nama_yg_menerima', v)}
                    placeholder="Pilih yang menerima"
                    required={false}
                    className="mb-3"
                  />
                  <div className="flex-1 min-h-[160px]">
                    <SignaturePad
                      onSignatureChange={(signature) => handleFormChange('ttd_yg_menerima', signature)}
                      defaultValue={formData.ttd_yg_menerima}
                      placeholder="Tanda tangan yang menerima"
                      disabled={isReadOnly}
                    />
                  </div>
                </div>
              </div>

              {/* Chief - Show for both officers and chiefs */}
              <div className="flex flex-col h-full min-h-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">Assistant Chief</label>
                <div className="flex-1 flex flex-col justify-start">
                  {isOfficer ? (
                    // Officers can select assistant chief from dropdown
                    <>
                      <SearchableDropdown
                        options={chiefOptions}
                        value={formData.nama_chief}
                        onChange={(value) => handleFormChange('nama_chief', value)}
                        placeholder="Pilih nama assistant chief"
                        required={true}
                        className="mb-3"
                        disabled={isReadOnly}
                      />

                    </>
                  ) : (
                    // Chiefs see their name as read-only
                    <input 
                      type="text" 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 mb-3 h-10 flex items-center" 
                      value={formData.nama_chief} 
                      readOnly 
                      disabled
                    />
                  )}
                  {/* Only show signature pad for chiefs */}
                  {isChief && (
                    <div className="flex-1 min-h-[160px]">
                      <SignaturePad
                        onSignatureChange={(signature) => handleFormChange('ttd_chief', signature)}
                        defaultValue={formData.ttd_chief}
                        placeholder="Tanda tangan chief"
                        disabled={false}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            {!isPreviewMode && (
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200">
                {isChief ? (
                  // Chief only sees "Selesaikan" button for submitted reports
                  (formData.status === 'submitted' || formData.status === 'Submitted') && (
                    <button 
                      type="button"
                      onClick={handleCompleteReport}
                      className="w-full sm:w-auto bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium disabled:opacity-50" 
                      disabled={loading}
                    >
                      {loading ? 'Menyelesaikan...' : 'Selesaikan'}
                    </button>
                  )
                ) : (
                  // Officers see save and submit buttons
                  <>
                    <button 
                      type="submit" 
                      className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50" 
                      disabled={loading}
                    >
                      {loading ? 'Menyimpan...' : (isEditMode ? 'Update Logbook' : 'Simpan Logbook')}
                    </button>
                    <button 
                      type="button"
                      onClick={handleSubmitToSupervisor}
                      className="w-full sm:w-auto bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium disabled:opacity-50" 
                      disabled={loading}
                    >
                      {loading ? 'Mengirim...' : 'Submit'}
                    </button>
                  </>
                )}
              </div>
            )}
        </form>
        </div>
      </div>
    </div>
  );
};

export default LogbookHarianMasterForm; 