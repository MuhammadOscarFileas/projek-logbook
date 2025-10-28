import React, { useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ open, onClose, pushLayout, collapsed, collapsedWidth = 64, fullWidth = 256 }) => {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const [openSubmenu, setOpenSubmenu] = useState(null);
  
  if (!auth) return null;
  const { user } = auth;

  const toggleSubmenu = (label) => {
    setOpenSubmenu(openSubmenu === label ? null : label);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDashboardClick = () => {
    // Navigate to appropriate dashboard based on user role
    if (user.role === 'superadmin' || user.role === 'admin') {
      navigate('/dashboard/superadmin?page=dashboard');
    } else if (user.role === 'chief') {
      navigate('/dashboard/chief');
    } else if (user.role === 'assistant_chief') {
      navigate('/dashboard/assistant-chief');
    } else {
      navigate('/dashboard/officer');
    }
  };

  // Navigation items based on user role
  const getNavigationItems = () => {
    if (user.role === 'assistant_chief') {
      return [
        {
          label: 'Dashboard',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
            </svg>
          ),
          onClick: () => navigate('/dashboard/assistant-chief'),
          isActive: window.location.pathname === '/dashboard/assistant-chief'
        },
        {
          label: 'Laporan Belum Ditandatangani',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
          onClick: () => navigate('/assistant-chief/belum-ditandatangani'),
          isActive: window.location.pathname === '/assistant-chief/belum-ditandatangani'
        },
        {
          label: 'Laporan Sudah Ditandatangani',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          onClick: () => navigate('/assistant-chief/laporan-sudah-ditandatangani'),
          isActive: window.location.pathname === '/assistant-chief/laporan-sudah-ditandatangani'
        },
      ];
    } else if (user.role === 'chief') {
      return [
        {
          label: 'Dashboard',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
            </svg>
          ),
          onClick: () => navigate('/dashboard/chief'),
          isActive: window.location.pathname === '/dashboard/chief'
        },
        {
          label: 'Buat Laporan',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          ),
          onClick: () => {
            const userPos = user.pos;
            if (userPos) {
              navigate(`/forms/masters/logbook-chief?lokasi=${encodeURIComponent(userPos)}`);
            } else {
              navigate('/forms/masters/logbook-chief');
            }
          },
          isActive: window.location.pathname.includes('/forms/masters/logbook-chief')
        },
        {
          label: 'Laporan Kemajuan Personel',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 9a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          ),
          onClick: () => navigate('/forms/masters/form-kemajuan-personel'),
          isActive: window.location.pathname === '/forms/masters/form-kemajuan-personel'
        },
        {
          label: 'Semua Laporan',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          ),
          onClick: () => {
            const userPos = user.pos;
            if (userPos) {
              navigate(`/chief/laporan?lokasi=${encodeURIComponent(userPos)}`);
            } else {
              navigate('/chief/laporan');
            }
          },
          isActive: window.location.pathname.includes('/chief/laporan')
        },
        
      ];
    } else if (user.role === 'superadmin' || user.role === 'admin') {
      return [
        {
          label: 'Dashboard',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
            </svg>
          ),
          onClick: () => navigate('/dashboard/superadmin?page=dashboard'),
          isActive: window.location.pathname === '/dashboard/superadmin' && window.location.search.includes('page=dashboard')
        },
        {
          label: 'Kelola Laporan',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 012 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          ),
          onClick: () => navigate('/dashboard/superadmin?page=logbook'),
          isActive: window.location.pathname === '/dashboard/superadmin' && window.location.search.includes('page=logbook')
        },
        {
          label: 'Laporan Kemajuan Personel',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 012 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          ),
          onClick: () => navigate('/dashboard/superadmin?page=lkp'),
          isActive: window.location.pathname === '/dashboard/superadmin' && window.location.search.includes('page=lkp')
        },
        {
          label: 'Kelola Pegawai',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 9a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          ),
          onClick: () => navigate('/dashboard/superadmin?page=pegawai'),
          isActive: window.location.pathname === '/dashboard/superadmin' && window.location.search.includes('page=pegawai')
        },
        
      ];
    } else {
      // Officer role
      return [
        {
          label: 'Dashboard',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
            </svg>
          ),
          onClick: () => navigate('/dashboard/officer'),
          isActive: window.location.pathname === '/dashboard/officer'
        },
        {
          label: 'Buat Laporan',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          ),
          isActive: window.location.pathname.includes('/forms/masters/logbook-harian'),
          submenu: (() => {
            // Generate submenu based on user's pos
            const userPos = user.pos;
            
            // Mapping pos to available locations
            const posToLocations = {
              'Terminal Protection': [
                'Ruang Tunggu',
                'Walking Patrol',
                'Mezzanine Domestik',
                'Kedatangan Domestik',
                'Akses Karyawan',
                'Building Protection',
                'CCTV',
              ],
              'Non-Terminal Protection': [
                'Main Gate',
                'Patroli Airside',
                'Patroli Landside',
                'Kargo Domestik',
                'Kargo International',
                'Walking Patrol'
              ],
              'Screening': [
                'PSCP',
                'Level 4',
                'HBS',
                'SCP LAGs',
                'SCP Transit',
                'SSCP',
                'OOG'
              ],
            };
            
            // If user has specific pos, get locations for that pos
            if (userPos && posToLocations[userPos]) {
              return posToLocations[userPos];
            }
            
            // If no pos or pos not found in mapping, return empty array
            return [];
          })().map(location => ({
            label: location,
            onClick: () => navigate(`/forms/masters/logbook-harian?lokasi=${encodeURIComponent(location)}`),
            isActive: window.location.pathname.includes('/forms/masters/logbook-harian') && window.location.search.includes(`lokasi=${encodeURIComponent(location)}`)
          }))
        }
      ];
    }
  };

  const navigationItems = getNavigationItems();

  // Sidebar style
  const sidebarWidth = collapsed ? collapsedWidth : fullWidth;
  const sidebarClass = `
    min-h-screen bg-gray-800 text-white flex flex-col transition-all duration-300 z-50
    fixed md:static top-0 left-0
    ${pushLayout ? '' : 'md:translate-x-0'}
    ${open ? 'translate-x-0' : '-translate-x-full'}
    md:block
  `;

  return (
    <>
      {/* Overlay for mobile */}
      {open && !pushLayout && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      {/* Sidebar */}
      <aside
        className={sidebarClass}
        style={{ width: sidebarWidth, minWidth: sidebarWidth, transition: 'all 0.3s' }}
      >
        {/* Only show profile and logout if not collapsed */}
        {!collapsed && (
          <>
            <div className="w-full flex flex-col items-center py-8 border-b border-gray-700">
              <div className="w-20 h-20 rounded-full bg-gray-600 flex items-center justify-center text-4xl mb-2">
                <span role="img" aria-label="avatar">👤</span>
              </div>
              <div className="text-lg font-semibold text-white text-center">{user.nama_lengkap}</div>
              <div className="text-xs text-gray-300 mt-1 capitalize">
                {user.role === 'superadmin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : user.role.replace('_', ' ')}
              </div>
              {user.pos && <div className="text-xs text-gray-400 mt-1">{user.pos}</div>}
            </div>
            
            {/* Navigation Menu */}
            <div className="flex-1 px-4 py-6">
              <div className="space-y-2">
                {navigationItems.map((item, index) => (
                  <div key={index}>
                    {item.submenu ? (
                      // Submenu item
                      <div>
                        <button
                          onClick={() => toggleSubmenu(item.label)}
                          className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 flex items-center justify-between ${
                            item.isActive 
                              ? 'bg-blue-600 text-white' 
                              : 'hover:bg-gray-700 text-gray-200 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center">
                            {item.icon}
                            <span className="font-medium ml-3">{item.label}</span>
                          </div>
                          <svg 
                            className={`w-4 h-4 transition-transform duration-200 ${openSubmenu === item.label ? 'rotate-180' : ''}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {openSubmenu === item.label && (
                          <div className="ml-4 mt-1 space-y-1">
                            {item.submenu.map((subItem, subIndex) => (
                              <button
                                key={subIndex}
                                onClick={subItem.onClick}
                                className={`w-full text-left px-4 py-2 rounded-lg transition-colors duration-200 flex items-center text-sm ${
                                  subItem.isActive 
                                    ? 'bg-blue-500 text-white' 
                                    : 'hover:bg-gray-700 text-gray-300 hover:text-white'
                                }`}
                              >
                                <span className="font-medium">{subItem.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      // Regular menu item
                      <button
                        onClick={item.onClick}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 flex items-center ${
                          item.isActive 
                            ? 'bg-blue-600 text-white' 
                            : 'hover:bg-gray-700 text-gray-200 hover:text-white'
                        }`}
                      >
                        {item.icon}
                        <span className="font-medium ml-3">{item.label}</span>
                      </button>
                    )}
                  </div>
                ))}
                
                <div className="border-t border-gray-700 pt-4 mt-4">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors duration-200 flex items-center text-gray-200 hover:text-white"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="font-medium ml-3">Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  );
};

export default Sidebar; 