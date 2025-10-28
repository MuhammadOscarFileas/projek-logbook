import React, { useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../auth/useAuth';
import Swal from 'sweetalert2';

const PasswordResetModal = ({ user, onSuccess, onClose }) => {
  const { auth, login } = useAuth();

  useEffect(() => {
    if (user && user.first_login) {
      showPasswordResetDialog();
    }
  }, [user]);

  const showPasswordResetDialog = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Reset Password',
      html: `
        <div class="text-left">
          <p class="text-gray-600 mb-4">
            Selamat datang, <span class="font-semibold">${user.nama_lengkap}</span>!
          </p>
          <p class="text-sm text-gray-500 mb-4">
            Ini adalah login pertama Anda. Silakan buat password baru untuk akun Anda.
          </p>
        </div>
        <input id="swal-input1" class="swal2-input" type="password" placeholder="Password Baru" required>
        <input id="swal-input2" class="swal2-input" type="password" placeholder="Konfirmasi Password" required>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Simpan Password',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      preConfirm: () => {
        const password1 = document.getElementById('swal-input1').value;
        const password2 = document.getElementById('swal-input2').value;
        
        if (!password1 || !password2) {
          Swal.showValidationMessage('Semua field harus diisi');
          return false;
        }
        
        if (password1 !== password2) {
          Swal.showValidationMessage('Password tidak cocok');
          return false;
        }
        
        if (password1.length < 6) {
          Swal.showValidationMessage('Password minimal 6 karakter');
          return false;
        }
        
        return { password: password1 };
      }
    });

    if (formValues) {
      try {
        // Show loading state
        Swal.fire({
          title: 'Menyimpan...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        // Update password and set first_login to false
        await axiosInstance.put(`/api/users/${user.user_id}`, {
          password: formValues.password,
          first_login: false
        });
        
        // Update auth context by fetching updated user data
        const updatedUserResponse = await axiosInstance.get(`/api/users/${user.user_id}`);
        
        if (updatedUserResponse.data) {
          const existingToken = auth?.token || localStorage.getItem('token');
          await login(existingToken, updatedUserResponse.data);
        }
        
        // Show success message
        await Swal.fire({
          title: 'Berhasil!',
          text: 'Password berhasil diubah',
          icon: 'success',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'OK'
        });
        
        onSuccess();
      } catch (err) {
        // Show error message
        await Swal.fire({
          title: 'Error!',
          text: err.response?.data?.error || 'Gagal mengubah password',
          icon: 'error',
          confirmButtonColor: '#d33',
          confirmButtonText: 'OK'
        });
      }
    } else {
      // User cancelled, close the modal
      onClose();
    }
  };

  // This component doesn't render anything visible
  return null;
};

export default PasswordResetModal; 