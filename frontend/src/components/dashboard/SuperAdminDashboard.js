import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../auth/useAuth';
import PasswordResetModal from '../PasswordResetModal';
import Swal from 'sweetalert2';
import injourneyLogo from '../../assets/injourneylogowhite.png';

const POS_OPTIONS = [
  { value: '', label: '--/--' },
  { value: 'Terminal Protection', label: 'Terminal Protection' },
  { value: 'Non-Terminal Protection', label: 'Non-Terminal Protection' },
  { value: 'Screening', label: 'Screening' },
];

const SHIFT_OPTIONS = [
  { value: 'Pagi (07:00 - 13:00)', label: 'Pagi (07:00 - 13:00)' },
  { value: 'Siang (13:00 - 19:00)', label: 'Siang (13:00 - 19:00)' },
  { value: 'Malam (19:00 - 07:00)', label: 'Malam (19:00 - 07:00)' },
];

const BANDARA_OPTIONS = [
  { value: 'Yogyakarta International Airport', label: 'Yogyakarta International Airport' },
  { value: 'Jendral Ahmad Yani International Airport', label: 'Jendral Ahmad Yani International Airport' },
  { value: 'Adisutjipto Airport', label: 'Adisutjipto Airport' },
  { value: 'Adi Soemarmo International Airport', label: 'Adi Soemarmo International Airport' },
  { value: 'Jendral Besar Soedirman Airport', label: 'Jendral Besar Soedirman Airport' },
  { value: 'Juanda International Airport', label: 'Juanda International Airport' },
  { value: 'Dhoho International Airport', label: 'Dhoho International Airport' },
];

// Function to generate random 8-character password
const generatePassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

const PegawaiList = ({ onRegister, refresh }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [notif, setNotif] = useState(null);
  const [resetPasswords, setResetPasswords] = useState({});
  
  // Pagination and search states
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(15);
  const [searchTerm, setSearchTerm] = useState('');
  const [bandaraFilter, setBandaraFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    axiosInstance.get('/api/users')
      .then(res => {
        const filteredData = res.data.filter(u => u.role === 'officer' || u.role === 'chief' || u.role === 'assistant_chief' || u.role === 'admin');
        setUsers(filteredData);
        setFilteredUsers(filteredData);
        setError(null);
      })
      .catch(err => setError('Gagal mengambil data user'))
      .finally(() => setLoading(false));
  }, [refresh, notif]);

  // Filter users based on search term and bandara filter
  useEffect(() => {
    const filtered = users.filter(user => {
      const matchesSearch = user.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBandara = !bandaraFilter || user.bandara === bandaraFilter;
      return matchesSearch && matchesBandara;
    });
    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [searchTerm, bandaraFilter, users]);

  const handleExpand = (id) => {
    setExpanded(expanded === id ? null : id);
    setEditUser(null);
    setNotif(null);
  };

  const handleEdit = (user) => {
    setEditUser({ ...user });
    setNotif(null);
  };

  const handleEditChange = (e) => {
    setEditUser({ ...editUser, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      await axiosInstance.put(`/api/users/${editUser.user_id}`, editUser);
      setNotif({ type: 'success', msg: 'Data user berhasil diupdate' });
      setEditUser(null);
    } catch (err) {
      setNotif({ type: 'error', msg: err.response?.data?.error || 'Gagal update user' });
    }
  };

  const handleDelete = async (user_id) => {
    if (!window.confirm('Yakin hapus user ini?')) return;
    try {
      await axiosInstance.delete(`/api/users/${user_id}`);
      setNotif({ type: 'success', msg: 'User dihapus' });
      setExpanded(null);
      // Refresh the user list
      const updatedUsers = users.filter(user => user.user_id !== user_id);
      setUsers(updatedUsers);
      setFilteredUsers(updatedUsers);
    } catch (err) {
      setNotif({ type: 'error', msg: err.response?.data?.error || 'Gagal hapus user' });
    }
  };

  const handleResetPassword = async (user_id) => {
    try {
      const newPassword = generatePassword();
      const res = await axiosInstance.put(`/api/users/${user_id}`, {
        password: newPassword,
        first_login: true
      });
      setNotif({ type: 'success', msg: `Password baru: ${newPassword}` });
      setResetPasswords(prev => ({ ...prev, [user_id]: newPassword }));
    } catch (err) {
      setNotif({ type: 'error', msg: err.response?.data?.error || 'Gagal reset password' });
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'officer':
        return 'bg-blue-100 text-blue-800';
      case 'chief':
        return 'bg-purple-100 text-purple-800';
      case 'assistant_chief':
        return 'bg-green-100 text-green-800';
      case 'admin':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };



  // Pagination logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleUsersPerPageChange = (newPerPage) => {
    setUsersPerPage(newPerPage);
    setCurrentPage(1);
  };

  return (
    <div className="mx-auto bg-white rounded-lg shadow-lg p-4 sm:p-6 fade-in">
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Daftar Pegawai</h2>
        <button 
          onClick={onRegister} 
          className="bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium shadow-sm text-sm"
        >
          + Register User
        </button>
      </div>

      {/* Search and Pagination Controls */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Cari Pegawai</label>
            <input
              type="text"
              placeholder="Cari berdasarkan nama..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="sm:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter Bandara</label>
            <select
              value={bandaraFilter}
              onChange={(e) => setBandaraFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Bandara</option>
              {BANDARA_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div className="sm:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-2">Tampilkan per halaman</label>
            <select
              value={usersPerPage}
              onChange={(e) => handleUsersPerPageChange(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
              <option value={25}>25</option>
            </select>
          </div>
        </div>

        {/* Results Info */}
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>
            Menampilkan {indexOfFirstUser + 1}-{Math.min(indexOfLastUser, filteredUsers.length)} dari {filteredUsers.length} pegawai
          </span>
          <div className="flex gap-4">
            {searchTerm && (
              <span>
                Hasil pencarian untuk: "{searchTerm}"
              </span>
            )}
            {bandaraFilter && (
              <span>
                Filter bandara: "{bandaraFilter}"
              </span>
            )}
          </div>
        </div>
      </div>
      
      {notif && (
        <div className={`mb-4 p-3 sm:p-4 rounded-lg text-xs sm:text-sm font-medium ${
          notif.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {notif.msg}
        </div>
      )}
      
      {loading && (
        <div className="flex justify-center items-center py-8 sm:py-12">
          <div className="loader"></div>
          <span className="ml-3 text-gray-500 text-sm">Memuat data...</span>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}
      
      {/* User List Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NIP</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bandara</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentUsers.map(user => (
                <tr key={user.user_id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleExpand(user.user_id)}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.nama_lengkap}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.nip || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.pos || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.bandara || '-'}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Expanded Edit Form */}
        {expanded && (
          <div className="border-t border-gray-200 bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Pegawai</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pegawai</label>
                  <input
                    name="nama_lengkap"
                    value={(editUser && editUser.user_id === expanded ? editUser.nama_lengkap : users.find(u => u.user_id === expanded)?.nama_lengkap) || ''}
                    onChange={e => setEditUser({ ...(editUser && editUser.user_id === expanded ? editUser : users.find(u => u.user_id === expanded)), nama_lengkap: e.target.value, user_id: expanded })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">NIP</label>
                  <input
                    name="nip"
                    value={(editUser && editUser.user_id === expanded ? editUser.nip : users.find(u => u.user_id === expanded)?.nip) || ''}
                    onChange={e => setEditUser({ ...(editUser && editUser.user_id === expanded ? editUser : users.find(u => u.user_id === expanded)), nip: e.target.value, user_id: expanded })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select 
                    name="role" 
                    value={(editUser && editUser.user_id === expanded ? editUser.role : users.find(u => u.user_id === expanded)?.role)} 
                    onChange={e => setEditUser({ ...(editUser && editUser.user_id === expanded ? editUser : users.find(u => u.user_id === expanded)), role: e.target.value, user_id: expanded })} 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="officer">Officer</option>
                    <option value="chief">Chief</option>
                    <option value="assistant_chief">Assistant Chief</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <select 
                    name="pos" 
                    value={(editUser && editUser.user_id === expanded ? editUser.pos : users.find(u => u.user_id === expanded)?.pos)} 
                    onChange={e => setEditUser({ ...(editUser && editUser.user_id === expanded ? editUser : users.find(u => u.user_id === expanded)), pos: e.target.value, user_id: expanded })} 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {POS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input 
                    name="password" 
                    value={
                      resetPasswords[expanded] 
                        ? resetPasswords[expanded] 
                        : users.find(u => u.user_id === expanded)?.first_login === true 
                          ? users.find(u => u.user_id === expanded)?.password 
                          : '••••••••'
                    } 
                    readOnly 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-600" 
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => handleSave()} 
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Simpan
                </button>
                <button 
                  onClick={() => handleResetPassword(expanded)} 
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  Reset Password
                </button>
                <button 
                  onClick={() => { if(window.confirm('Yakin hapus user ini?')) handleDelete(expanded); }} 
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Hapus
                </button>
                <button 
                  onClick={() => setExpanded(null)} 
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sebelumnya
            </button>
            <span className="text-sm text-gray-700">
              Halaman {currentPage} dari {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const RegisterUserForm = ({ onBack, onSuccess }) => {
  const [form, setForm] = useState({
    nama_lengkap: '',
    nip: '',
    email: '',
    role: 'officer',
    pos: 'Terminal Protection',
    shift: '',
    lokasi: '',
    bandara: 'Yogyakarta International Airport',
    password: generatePassword(),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notif, setNotif] = useState(null);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotif(null);
    try {
      const formWithPassword = { ...form, first_login: true };
      
      const res = await axiosInstance.post('/api/users/register', formWithPassword);
      setNotif({ type: 'success', msg: `User berhasil dibuat. Password: ${form.password}` });
      setForm({ nama_lengkap: '', nip: '', email: '', role: 'officer', pos: 'Terminal Protection', shift: '', lokasi: '', bandara: 'Yogyakarta International Airport', password: generatePassword() });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal register user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-4 sm:p-6 fade-in">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Register User</h2>
      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
          <input 
            name="nama_lengkap" 
            placeholder="Nama Lengkap" 
            value={form.nama_lengkap} 
            onChange={handleChange} 
            required 
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">NIP</label>
          <input 
            name="nip" 
            placeholder="Nomor Induk Pegawai"
            value={form.nip}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
          />
        </div>
        {/* <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input 
            name="email" 
            placeholder="Email" 
            value={form.email} 
            onChange={handleChange} 
            required 
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
          />
        </div> */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <select 
            name="role" 
            value={form.role} 
            onChange={handleChange} 
            required 
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="officer">Officer</option>
            <option value="chief">Chief</option>
            <option value="assistant_chief">Assistant Chief</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
          <select 
            name="pos" 
            value={form.pos} 
            onChange={handleChange} 
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            {POS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bandara</label>
          <select 
            name="bandara" 
            value={form.bandara} 
            onChange={handleChange} 
            required 
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            {BANDARA_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        {/* <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
          <select 
            name="shift" 
            value={form.shift} 
            onChange={handleChange} 
            required 
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">Pilih Shift</option>
            {SHIFT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div> */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input 
            type="text"
            name="password"
            placeholder="Password akan di-generate otomatis"
            value={form.password}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
          />
          <p className="text-xs text-gray-500 mt-1">
            Password otomatis sudah di-generate, bisa diubah sesuai kebutuhan
          </p>
        </div>
        <div className="flex gap-3 pt-4">
          <button 
            type="submit" 
            disabled={loading} 
            className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 text-sm"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
          <button 
            type="button" 
            onClick={onBack} 
            className="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm"
          >
            Kembali
          </button>
        </div>
      </form>
      {notif && (
        <div className="mt-4 p-3 sm:p-4 rounded-lg bg-green-50 text-green-800 border border-green-200 text-sm">
          {notif.msg}
        </div>
      )}
      {error && (
        <div className="mt-4 p-3 sm:p-4 rounded-lg bg-red-50 text-red-800 border border-red-200 text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

const SuperAdminDashboard = () => {
  const { auth } = useAuth();
  const location = useLocation();
  const [page, setPage] = useState('main');
  const [refreshPegawai, setRefreshPegawai] = useState(0);
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  // Read query parameter and set page state
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const pageParam = urlParams.get('page');
    if (pageParam === 'logbook' || pageParam === 'pegawai' || pageParam === 'lkp' || pageParam === 'dashboard') {
      setPage(pageParam === 'dashboard' ? 'main' : pageParam);
    }
  }, [location.search]);

  // Check if user needs to reset password
  useEffect(() => {
    if (auth?.user?.first_login === true) {
      setShowPasswordReset(true);
    }
  }, [auth?.user?.first_login]);

  const handlePasswordResetSuccess = () => {
    setShowPasswordReset(false);
    // The auth context is already updated by the modal
  };

  if (page === 'pegawai') return (
    <>
      {showPasswordReset && auth?.user && (
        <PasswordResetModal
          user={auth.user}
          onSuccess={handlePasswordResetSuccess}
          onClose={() => setShowPasswordReset(false)}
        />
      )}
      <div className="p-4 fade-in">
        <button 
          onClick={() => {
            setPage('main');
            window.history.pushState({}, '', '/dashboard/superadmin?page=dashboard');
          }} 
          className="mb-4 button bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
        >
          Kembali
        </button>
        <PegawaiList onRegister={() => setPage('register')} refresh={refreshPegawai} />
      </div>
    </>
  );
  
  if (page === 'register') return (
    <>
      {showPasswordReset && auth?.user && (
        <PasswordResetModal
          user={auth.user}
          onSuccess={handlePasswordResetSuccess}
          onClose={() => setShowPasswordReset(false)}
        />
      )}
      <RegisterUserForm 
        onBack={() => setPage('pegawai')} 
        onSuccess={() => { 
          setPage('pegawai'); 
          setRefreshPegawai(r => r+1); 
        }} 
      />
    </>
  );

  if (page === 'logbook') return (
    <>
      {showPasswordReset && auth?.user && (
        <PasswordResetModal
          user={auth.user}
          onSuccess={handlePasswordResetSuccess}
          onClose={() => setShowPasswordReset(false)}
        />
      )}
      <div className="p-4 fade-in">
        <button 
          onClick={() => {
            setPage('main');
            window.history.pushState({}, '', '/dashboard/superadmin?page=dashboard');
          }} 
          className="mb-4 button bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
        >
          Kembali
        </button>
        <SuperadminLogbookList />
      </div>
    </>
  );

  if (page === 'lkp') return (
    <>
      {showPasswordReset && auth?.user && (
        <PasswordResetModal
          user={auth.user}
          onSuccess={handlePasswordResetSuccess}
          onClose={() => setShowPasswordReset(false)}
        />
      )}
      <div className="p-4 fade-in">
        <button 
          onClick={() => {
            setPage('main');
            window.history.pushState({}, '', '/dashboard/superadmin?page=dashboard');
          }} 
          className="mb-4 button bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
        >
          Kembali
        </button>
        <SuperadminLkpList />
      </div>
    </>
  );

  return (
    <>
      {showPasswordReset && auth?.user && (
        <PasswordResetModal
          user={auth.user}
          onSuccess={handlePasswordResetSuccess}
          onClose={() => setShowPasswordReset(false)}
        />
      )}
      <div className="min-h-screen bg-gray-50 fade-in flex flex-col">
        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
        <div className="card bg-white rounded-lg shadow p-8 flex flex-col items-center cursor-pointer hover:shadow-lg transition" onClick={() => setPage('logbook')}>
          <div className="w-12 h-12 mb-4 flex items-center justify-center bg-blue-100 rounded-full">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m0 0H3m9 0a9 9 0 100-18 9 9 0 000 18z" /></svg>
          </div>
          <h2 className="text-lg font-semibold mb-2">Log Book</h2>
          <p className="text-gray-500 text-center">Lihat semua log book/laporan</p>
        </div>
        <div className="card bg-white rounded-lg shadow p-8 flex flex-col items-center cursor-pointer hover:shadow-lg transition" onClick={() => setPage('lkp')}>
          <div className="w-12 h-12 mb-4 flex items-center justify-center bg-purple-100 rounded-full">
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 9a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          </div>
          <h2 className="text-lg font-semibold mb-2">Laporan Kemajuan Personel</h2>
          <p className="text-gray-500 text-center">Lihat semua LKP dari semua unit</p>
        </div>
        <div className="card bg-white rounded-lg shadow p-8 flex flex-col items-center cursor-pointer hover:shadow-lg transition" onClick={() => setPage('pegawai')}>
          <div className="w-12 h-12 mb-4 flex items-center justify-center bg-green-100 rounded-full">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M16 3.13a4 4 0 010 7.75M8 3.13a4 4 0 000 7.75" /></svg>
          </div>
          <h2 className="text-lg font-semibold mb-2">Pegawai</h2>
          <p className="text-gray-500 text-center">Lihat dan kelola data pegawai</p>
        </div>
      </div>
        </div>
      </div>
    </>
  );
};

function SuperadminLogbookList() {
  const { auth } = useAuth();
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  // Filter states
  const [filters, setFilters] = useState({ bandara: '', lokasi: '', tanggalMulai: '', tanggalSelesai: '' });
  const [sortConfig, setSortConfig] = useState({ key: 'tanggal', direction: 'desc' });
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [reportsPerPage, setReportsPerPage] = useState(15);

  // Get bandara options based on user role
  const getBandaraOptions = () => {
    console.log('getBandaraOptions called:', {
      role: auth?.user?.role,
      bandara: auth?.user?.bandara
    });
    
    if (auth?.user?.role === 'superadmin') {
      // Superadmin can see and edit all bandara options
      return [
        { value: '', label: 'Semua Bandara' },
        ...BANDARA_OPTIONS
      ];
    } else if (auth?.user?.role === 'admin') {
      // Admin can only see their assigned bandara and it's locked
      const userBandara = auth.user.bandara;
      if (userBandara) {
        return [
          { value: userBandara, label: userBandara }
        ];
      }
      return [{ value: '', label: 'Tidak ada bandara' }];
    }
    return [{ value: '', label: 'Semua Bandara' }];
  };

  // Set initial bandara filter for admin users
  useEffect(() => {
    console.log('useEffect bandara triggered:', {
      role: auth?.user?.role,
      bandara: auth?.user?.bandara,
      user: auth?.user
    });
    
    if (auth?.user?.role === 'admin' && auth?.user?.bandara) {
      console.log('Setting bandara filter for admin:', auth.user.bandara);
      setFilters(prev => ({ ...prev, bandara: auth.user.bandara }));
    }
  }, [auth?.user?.role, auth?.user?.bandara]);

  const lokasiOptions = [
    { value: 'PSCP', label: 'PSCP' },
    { value: 'Level 4', label: 'Level 4' },
    { value: 'HBS', label: 'HBS' },
    { value: 'SCP LAGs', label: 'SCP LAGs' },
    { value: 'SCP Transit', label: 'SCP Transit' },
    { value: 'SSCP', label: 'SSCP' },
    { value: 'OOG', label: 'OOG' },
    { value: 'Chief Terminal Protection', label: 'Chief Terminal Protection' },
    { value: 'Ruang Tunggu', label: 'Ruang Tunggu' },
    { value: 'Walking Patrol', label: 'Walking Patrol' },
    { value: 'Mezzanine Domestik', label: 'Mezzanine Domestik' },
    { value: 'Kedatangan Domestik', label: 'Kedatangan Domestik' },
    { value: 'Akses Karyawan', label: 'Akses Karyawan' },
    { value: 'Building Protection', label: 'Building Protection' },
    { value: 'CCTV', label: 'CCTV' },
    { value: 'Main Gate', label: 'Main Gate' },
    { value: 'Chief Non-Terminal', label: 'Chief Non-Terminal' },
    { value: 'Patroli', label: 'Patroli' },
    { value: 'Kargo', label: 'Kargo' },
    { value: 'Papa November', label: 'Papa November' },
    { value: 'Pos Congot', label: 'Pos Congot' }
  ];

  useEffect(() => {
    setLoading(true);
    setError(null);
    axiosInstance.get('/api/logbook-harian-master/submitted-completed')
      .then(res => { 
        console.log('Submitted/Completed reports:', res.data);
        setReports(res.data); 
        setFilteredReports(res.data); 
      })
      .catch(err => {
        console.error('Error fetching submitted/completed reports:', err);
        setError('Gagal mengambil data laporan');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let filtered = [...reports];
    
    // Filter by bandara
    if (filters.bandara) {
      filtered = filtered.filter(report => {
        // Assuming reports have a bandara field, if not, you might need to adjust this logic
        const reportBandara = report.bandara || '';
        return reportBandara.toLowerCase().includes(filters.bandara.toLowerCase());
      });
    }
    
    if (filters.lokasi) {
      filtered = filtered.filter(report => report.lokasi && report.lokasi.toLowerCase().includes(filters.lokasi.toLowerCase()));
    }
    if (filters.tanggalMulai || filters.tanggalSelesai) {
      filtered = filtered.filter(report => {
        if (!report.tanggal) return false;
        const reportDate = new Date(report.tanggal);
        if (filters.tanggalMulai) {
          const startDate = new Date(filters.tanggalMulai);
          if (reportDate < startDate) return false;
        }
        if (filters.tanggalSelesai) {
          const endDate = new Date(filters.tanggalSelesai);
          if (reportDate > endDate) return false;
        }
        return true;
      });
    }
    
    // Sort the filtered reports
    filtered.sort((a, b) => {
      const { key, direction } = sortConfig;
      let aValue, bValue;
      
      switch (key) {
        case 'tanggal':
          aValue = new Date(a.tanggal || 0);
          bValue = new Date(b.tanggal || 0);
          break;
        case 'lokasi':
          aValue = a.lokasi || '';
          bValue = b.lokasi || '';
          break;
        case 'jenis':
          aValue = a.type || '';
          bValue = b.type || '';
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'bandara':
          aValue = a.bandara || '';
          bValue = b.bandara || '';
          break;
        default:
          aValue = a[key] || '';
          bValue = b[key] || '';
      }
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    setFilteredReports(filtered);
    setCurrentPage(1);
  }, [reports, filters, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortConfig.direction === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleResetFilter = () => {
    setFilters({ bandara: '', lokasi: '', tanggalMulai: '', tanggalSelesai: '' });
    setSortConfig({ key: 'tanggal', direction: 'desc' });
  };

  // Pagination logic
  const indexOfLastReport = currentPage * reportsPerPage;
  const indexOfFirstReport = indexOfLastReport - reportsPerPage;
  const currentReports = filteredReports.slice(indexOfFirstReport, indexOfLastReport);
  const totalPages = Math.ceil(filteredReports.length / reportsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleReportsPerPageChange = (newSize) => {
    setReportsPerPage(newSize);
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handlePreview = (reportId) => {
    navigate(`/logbook-preview/${reportId}`);
  };

  const handleDownloadPDF = async (reportId) => {
    try {
      const response = await axiosInstance.get(`/api/logbook-harian-master-pdf/export-pdf?id=${reportId}`, {
        responseType: 'blob'
      });
      
      // Create blob URL and trigger download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `logbook-${reportId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Gagal mengunduh PDF. Silakan coba lagi.');
    }
  };

  const handleDownloadAllReports = async () => {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (filters.tanggalMulai) params.append('start_date', filters.tanggalMulai);
      if (filters.tanggalSelesai) params.append('end_date', filters.tanggalSelesai);
      if (filters.lokasi) params.append('lokasi', filters.lokasi);

      const response = await axiosInstance.get(`/api/logbook-harian-master-pdf/export-pdf?${params.toString()}`, {
        responseType: 'blob'
      });
      
      // Create blob URL and trigger download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename based on filters
      let filename = 'laporan-semua';
      if (filters.tanggalMulai && filters.tanggalSelesai) {
        filename += `-${filters.tanggalMulai}-${filters.tanggalSelesai}`;
      }
      if (filters.bandara) {
        filename += `-${filters.bandara.replace(/\s+/g, '-')}`;
      }
      if (filters.lokasi) {
        filename += `-${filters.lokasi.replace(/\s+/g, '-')}`;
      }
      filename += '.pdf';
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading all reports PDF:', error);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Download',
        text: 'Gagal mengunduh laporan. Silakan coba lagi.',
        confirmButtonColor: '#3085d6',
      });
    }
  };

  const handleDownloadAllReportsConfirm = () => {
    // Check if there are any reports to download
    if (filteredReports.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Tidak Ada Laporan',
        text: 'Tidak ada laporan yang sesuai dengan filter yang dipilih. Silakan ubah filter atau pilih tanggal yang berbeda.',
        confirmButtonColor: '#3085d6',
      });
      return;
    }

    // Build confirmation message
    let confirmationMessage = 'Apakah Anda yakin ingin mendownload laporan dengan filter berikut?\n\n';
    
    if (filters.tanggalMulai && filters.tanggalSelesai) {
      confirmationMessage += `• Tanggal: ${filters.tanggalMulai} s/d ${filters.tanggalSelesai}\n`;
    } else {
      confirmationMessage += `• Tanggal: Semua tanggal\n`;
    }
    
          if (filters.bandara) {
        confirmationMessage += `• Bandara: ${filters.bandara}\n`;
      } else {
        confirmationMessage += `• Bandara: Semua bandara\n`;
      }
      
      if (filters.lokasi) {
        confirmationMessage += `• Pos: ${filters.lokasi}\n`;
      } else {
        confirmationMessage += `• Pos: Semua pos\n`;
      }
    
    confirmationMessage += `\nTotal laporan yang akan diunduh: ${filteredReports.length} laporan`;
    confirmationMessage += '\nLaporan akan diunduh dalam format PDF.';

    Swal.fire({
      title: 'Konfirmasi Download Laporan',
      text: confirmationMessage,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Download',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        handleDownloadAllReports();
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 fade-in p-6">
      <div className="w-full">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Daftar Semua Laporan</h1>
          </div>
          <p className="text-gray-600">Menampilkan semua laporan dengan status Completed dan Submitted</p>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Filter & Urutkan Laporan</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bandara</label>
              <select 
                className="w-full border border-gray-300 rounded-lg px-3 py-2" 
                value={filters.bandara} 
                onChange={e => handleFilterChange('bandara', e.target.value)}
                disabled={auth?.user?.role === 'admin'}
              >
                {getBandaraOptions().map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>

            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pos</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2" value={filters.lokasi} onChange={e => handleFilterChange('lokasi', e.target.value)}>
                <option value="">Semua Pos</option>
                {lokasiOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Mulai</label>
              <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2" value={filters.tanggalMulai} onChange={e => handleFilterChange('tanggalMulai', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Selesai</label>
              <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2" value={filters.tanggalSelesai} onChange={e => handleFilterChange('tanggalSelesai', e.target.value)} />
            </div>
          </div>
          <div className="flex justify-between items-center mt-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Tampilkan:</label>
              <select 
                className="border border-gray-300 rounded px-2 py-1 text-sm"
                value={reportsPerPage}
                onChange={(e) => handleReportsPerPageChange(Number(e.target.value))}
              >
                <option value={15}>15</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-gray-600">laporan per halaman</span>
            </div>
          </div>
          
          {/* Action Buttons - Moved below pagination for better mobile layout */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 justify-end">
            <button 
              className={`px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors duration-200 text-sm ${
                filters.tanggalMulai && filters.tanggalSelesai
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                  : 'bg-gray-400 text-gray-500 cursor-not-allowed'
              }`}
              onClick={handleDownloadAllReportsConfirm} 
              type="button"
              disabled={!filters.tanggalMulai || !filters.tanggalSelesai}
              title={
                filters.tanggalMulai && filters.tanggalSelesai
                  ? 'Download laporan sesuai filter yang dipilih'
                  : 'Pilih tanggal mulai dan tanggal selesai untuk mengunduh laporan'
              }
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="hidden sm:inline">Download Laporan</span>
              <span className="sm:hidden">Download</span>
            </button>
            <button 
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 sm:px-4 py-2 rounded-lg transition-colors duration-200 shadow-sm text-sm flex items-center justify-center" 
              onClick={handleResetFilter} 
              type="button"
              title="Reset semua filter yang dipilih"
            >
              <svg className="w-4 h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden sm:inline">Reset Filter</span>
              <span className="sm:hidden">Reset</span>
            </button>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('jenis')}
                  >
                    <div className="flex items-center">
                      Jenis Laporan
                      {getSortIcon('jenis')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('bandara')}
                  >
                    <div className="flex items-center">
                      Bandara
                      {getSortIcon('bandara')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('lokasi')}
                  >
                    <div className="flex items-center">
                      Pos
                      {getSortIcon('lokasi')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('tanggal')}
                  >
                    <div className="flex items-center">
                      Tanggal
                      {getSortIcon('tanggal')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center">
                      Status
                      {getSortIcon('status')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Download</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentReports.length === 0 ? (
                  <tr>
                                      <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    {reports.length === 0 ? 'Tidak ada laporan' : 'Tidak ada laporan yang sesuai dengan filter'}
                  </td>
                  </tr>
                ) : (
                  currentReports.map((report, index) => (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td 
                        className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 cursor-pointer"
                        onClick={() => handlePreview(report.id)}
                      >
                        {report.type || 'Logbook Harian'}
                      </td>
                      <td 
                        className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 cursor-pointer"
                        onClick={() => handlePreview(report.id)}
                      >
                        {report.bandara || '-'}
                      </td>
                      <td 
                        className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 cursor-pointer"
                        onClick={() => handlePreview(report.id)}
                      >
                        {report.lokasi || '-'}
                      </td>
                      <td 
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 cursor-pointer"
                        onClick={() => handlePreview(report.id)}
                      >
                        {formatDate(report.tanggal)}
                      </td>
                      <td 
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 cursor-pointer"
                        onClick={() => handlePreview(report.id)}
                      >
                        {report.status}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadPDF(report.id);
                          }}
                          className="text-green-600 hover:text-green-800"
                          title="Download PDF"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-6 bg-white rounded-lg shadow p-4">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="mb-4 sm:mb-0">
              <p className="text-sm text-gray-600">
                Total laporan: <span className="font-semibold text-green-600">{reports.length}</span>
                {filteredReports.length !== reports.length && (
                  <span className="ml-2 text-gray-500">(Menampilkan {filteredReports.length} dari {reports.length})</span>
                )}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Menampilkan {indexOfFirstReport + 1}-{Math.min(indexOfLastReport, filteredReports.length)} dari {filteredReports.length} laporan
              </p>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 text-sm border rounded-md ${
                      currentPage === page
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SuperadminLkpList() {
  const [lkpList, setLkpList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  // Filter states
  const [filters, setFilters] = useState({ unit: '', tanggalMulai: '', tanggalSelesai: '' });
  const [sortConfig, setSortConfig] = useState({ key: 'hari_tanggal', direction: 'desc' });
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [lkpPerPage, setLkpPerPage] = useState(15);
  
  const unitOptions = [
    { value: 'Terminal Protection', label: 'Terminal Protection' },
    { value: 'Non-Terminal Protection', label: 'Non-Terminal Protection' },
    { value: 'Screening', label: 'Screening' }
  ];

  useEffect(() => {
    fetchLkpData();
  }, []);

  const fetchLkpData = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/form-kemajuan-personel');
      
      // Sort by latest date (hari_tanggal) - newest first
      const sortedData = response.data.sort((a, b) => {
        const dateA = new Date(a.hari_tanggal);
        const dateB = new Date(b.hari_tanggal);
        return dateB - dateA; // Descending order (newest first)
      });
      
      setLkpList(sortedData);
      setError(null);
    } catch (err) {
      console.error('Error fetching LKP data:', err);
      setError('Gagal mengambil data Laporan Kemajuan Personel');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortConfig.direction === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  const handleResetFilter = () => {
    setFilters({ unit: '', tanggalMulai: '', tanggalSelesai: '' });
    setSortConfig({ key: 'hari_tanggal', direction: 'desc' });
    setCurrentPage(1);
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

  // Filter and sort data
  const filteredLkp = useMemo(() => {
    let filtered = [...lkpList];
    
    // Apply filters
    if (filters.unit) {
      filtered = filtered.filter(lkp => lkp.unit === filters.unit);
    }
    if (filters.tanggalMulai) {
      filtered = filtered.filter(lkp => new Date(lkp.hari_tanggal) >= new Date(filters.tanggalMulai));
    }
    if (filters.tanggalSelesai) {
      filtered = filtered.filter(lkp => new Date(lkp.hari_tanggal) <= new Date(filters.tanggalSelesai));
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      switch (sortConfig.key) {
        case 'hari_tanggal':
          aValue = new Date(a.hari_tanggal || 0);
          bValue = new Date(b.hari_tanggal || 0);
          break;
        case 'unit':
          aValue = (a.unit || '').toLowerCase();
          bValue = (b.unit || '').toLowerCase();
          break;
        case 'shift':
          aValue = (a.shift || '').toLowerCase();
          bValue = (b.shift || '').toLowerCase();
          break;
        case 'pleton':
          aValue = (a.pleton || '').toLowerCase();
          bValue = (b.pleton || '').toLowerCase();
          break;
        case 'nama_chief':
          aValue = (a.nama_chief || '').toLowerCase();
          bValue = (b.nama_chief || '').toLowerCase();
          break;
        default:
          return 0;
      }
      
      if (sortConfig.direction === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
    
    return filtered;
  }, [lkpList, filters, sortConfig]);

  // Pagination logic
  const indexOfLastLkp = currentPage * lkpPerPage;
  const indexOfFirstLkp = indexOfLastLkp - lkpPerPage;
  const currentLkp = filteredLkp.slice(indexOfFirstLkp, indexOfLastLkp);
  const totalPages = Math.ceil(filteredLkp.length / lkpPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleLkpPerPageChange = (newSize) => {
    setLkpPerPage(newSize);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-500">Memuat data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Daftar Laporan Kemajuan Personel</h1>
        <p className="text-gray-600">Semua LKP dari semua unit</p>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
            <select 
              className="w-full border border-gray-300 rounded-lg px-3 py-2" 
              value={filters.unit} 
              onChange={e => handleFilterChange('unit', e.target.value)}
            >
              <option value="">Semua Unit</option>
              {unitOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Mulai</label>
            <input 
              type="date" 
              className="w-full border border-gray-300 rounded-lg px-3 py-2" 
              value={filters.tanggalMulai} 
              onChange={e => handleFilterChange('tanggalMulai', e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Selesai</label>
            <input 
              type="date" 
              className="w-full border border-gray-300 rounded-lg px-3 py-2" 
              value={filters.tanggalSelesai} 
              onChange={e => handleFilterChange('tanggalSelesai', e.target.value)} 
            />
          </div>
        </div>
        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-700">Tampilkan:</label>
            <select 
              className="border border-gray-300 rounded px-2 py-1 text-sm"
              value={lkpPerPage}
              onChange={(e) => handleLkpPerPageChange(Number(e.target.value))}
            >
              <option value={15}>15</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
            </select>
            <span className="text-sm text-gray-600">LKP per halaman</span>
          </div>
          <button 
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg" 
            onClick={handleResetFilter}
          >
            Reset Filter
          </button>
        </div>
      </div>

      {/* LKP Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('hari_tanggal')}
                >
                  <div className="flex items-center">
                    Tanggal
                    {getSortIcon('hari_tanggal')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('unit')}
                >
                  <div className="flex items-center">
                    Unit
                    {getSortIcon('unit')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('shift')}
                >
                  <div className="flex items-center">
                    Shift
                    {getSortIcon('shift')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('pleton')}
                >
                  <div className="flex items-center">
                    Pleton
                    {getSortIcon('pleton')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Personil
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kekuatan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Keterangan
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('nama_chief')}
                >
                  <div className="flex items-center">
                    Chief
                    {getSortIcon('nama_chief')}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentLkp.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    {lkpList.length === 0 ? 'Tidak ada data LKP' : 'Tidak ada data yang sesuai dengan filter'}
                  </td>
                </tr>
              ) : (
                currentLkp.map((lkp, index) => (
                  <tr key={lkp.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(lkp.hari_tanggal)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {lkp.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{lkp.shift || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{lkp.pleton || '-'}</td>
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-6 bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <div className="mb-4 sm:mb-0">
            <p className="text-sm text-gray-600">
              Total LKP: <span className="font-semibold text-purple-600">{lkpList.length}</span>
              {filteredLkp.length !== lkpList.length && (
                <span className="ml-2 text-gray-500">(Menampilkan {filteredLkp.length} dari {lkpList.length})</span>
              )}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Menampilkan {indexOfFirstLkp + 1}-{Math.min(indexOfLastLkp, filteredLkp.length)} dari {filteredLkp.length} LKP
            </p>
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-2 text-sm border rounded-md ${
                    currentPage === page
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SuperAdminDashboard; 
