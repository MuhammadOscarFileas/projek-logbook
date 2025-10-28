import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/useAuth';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';

const AsChiefSignedReports = () => {
	const { auth } = useAuth();
	const navigate = useNavigate();
	const [reports, setReports] = useState([]);
	const [filteredReports, setFilteredReports] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	
	// Pagination
	const [currentPage, setCurrentPage] = useState(1);
	const [reportsPerPage] = useState(15);

	// Filter states
	const [filters, setFilters] = useState({
		jenisLaporan: '',
		lokasi: '',
		tanggalMulai: '',
		tanggalSelesai: ''
	});

	// Sort dropdown state
	const [sortBy, setSortBy] = useState('tanggal_desc');

	// Options for dropdowns
	const jenisLaporanOptions = [
		{ value: 'Logbook Harian', label: 'Logbook Harian' }
	];

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

	const sortOptions = [
		{ value: 'tanggal_desc', label: 'Tanggal (Terbaru)' },
		{ value: 'tanggal_asc', label: 'Tanggal (Terlama)' },
		{ value: 'lokasi_asc', label: 'Pos (A-Z)' },
		{ value: 'lokasi_desc', label: 'Pos (Z-A)' },
		{ value: 'jenis_asc', label: 'Jenis Laporan (A-Z)' },
		{ value: 'jenis_desc', label: 'Jenis Laporan (Z-A)' }
	];

	useEffect(() => {
		const fetchCompletedReports = async () => {
			try {
				setLoading(true);
				setError(null);
				
				const assistantName = auth?.user?.nama_lengkap;
				const response = await axiosInstance.get('/api/logbook-harian-master/');
				
				const completedReports = response.data.filter(report => 
					report.nama_chief === assistantName &&
					(report.status === 'Completed' || (report.ttd_chief && report.ttd_chief !== ''))
				).map(report => ({ ...report, type: 'Logbook Harian', modelName: 'logbook_harian_master' }));
				
				console.log('Total reports from API:', response.data.length);
				console.log('Assistant name:', assistantName);
				console.log('Completed reports found:', completedReports.length);
				console.log('Sample reports:', completedReports.slice(0, 3));
				
				setReports(completedReports);
				setFilteredReports(completedReports);
			} catch (err) {
				console.error('Error fetching reports:', err);
				setError('Gagal mengambil data laporan');
			} finally {
				setLoading(false);
			}
		};

		if (auth?.user?.nama_lengkap) fetchCompletedReports();
	}, [auth?.user?.nama_lengkap]);

	// Apply filters and sorting whenever filters or sortBy change
	useEffect(() => {
		let filtered = [...reports];

		// Filter by jenis laporan
		if (filters.jenisLaporan) {
			filtered = filtered.filter(report => report.type.toLowerCase().includes(filters.jenisLaporan.toLowerCase()));
		}

		// Filter by lokasi
		if (filters.lokasi) {
			filtered = filtered.filter(report => report.lokasi && report.lokasi.toLowerCase().includes(filters.lokasi.toLowerCase()));
		}

		// Filter by date range
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

		// Sorting
		filtered.sort((a, b) => {
			switch (sortBy) {
				case 'tanggal_desc':
					return new Date(b.tanggal) - new Date(a.tanggal);
				case 'tanggal_asc':
					return new Date(a.tanggal) - new Date(b.tanggal);
				case 'lokasi_asc':
					return (a.lokasi || '').localeCompare(b.lokasi || '');
				case 'lokasi_desc':
					return (b.lokasi || '').localeCompare(a.lokasi || '');
				case 'jenis_asc':
					return (a.type || '').localeCompare(b.type || '');
				case 'jenis_desc':
					return (b.type || '').localeCompare(a.type || '');
				default:
					return 0;
			}
		});

		setFilteredReports(filtered);
		setCurrentPage(1);
	}, [reports, filters, sortBy]);

	const handleResetFilter = () => {
		setFilters({ jenisLaporan: '', lokasi: '', tanggalMulai: '', tanggalSelesai: '' });
		setSortBy('tanggal_desc');
	};

	// Pagination derived values
	const indexOfLastReport = currentPage * reportsPerPage;
	const indexOfFirstReport = indexOfLastReport - reportsPerPage;
	const currentReports = filteredReports.slice(indexOfFirstReport, indexOfLastReport);
	const totalPages = Math.ceil(filteredReports.length / reportsPerPage);

	const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

	const handleReportClick = (report) => navigate(`/logbook-preview/${report.id}`);

	const formatDate = (dateString) => {
		if (!dateString) return '-';
		const date = new Date(dateString);
		return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
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
						<h1 className="text-2xl font-bold text-gray-900">Laporan yang Sudah Ditandatangani</h1>
						<button onClick={() => navigate('/dashboard/assistant-chief')} className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">Kembali ke Dashboard</button>
					</div>
					<p className="text-gray-600">Menampilkan laporan yang sudah Anda tandatangani sebagai assistant chief</p>
				</div>

				{/* Filters and Sorting */}
				<div className="bg-white rounded-lg shadow-lg p-6 mb-6">
					<div className="grid grid-cols-1 md:grid-cols-5 gap-4">
						{/* Sort Dropdown */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">Urutkan</label>
							<select className="w-full border border-gray-300 rounded-lg px-3 py-2" value={sortBy} onChange={e => setSortBy(e.target.value)}>
								{sortOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
							</select>
						</div>
						{/* Filter Jenis Laporan */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">Jenis Laporan</label>
							<select className="w-full border border-gray-300 rounded-lg px-3 py-2" value={filters.jenisLaporan} onChange={e => setFilters(f => ({ ...f, jenisLaporan: e.target.value }))}>
								<option value="">Semua Jenis</option>
								{jenisLaporanOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
							</select>
						</div>
						{/* Filter Lokasi */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">Pos</label>
							<select className="w-full border border-gray-300 rounded-lg px-3 py-2" value={filters.lokasi} onChange={e => setFilters(f => ({ ...f, lokasi: e.target.value }))}>
								<option value="">Semua Pos</option>
								{lokasiOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
							</select>
						</div>
						{/* Filter Tanggal Mulai */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Mulai</label>
							<input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2" value={filters.tanggalMulai} onChange={e => setFilters(f => ({ ...f, tanggalMulai: e.target.value }))} />
						</div>
						{/* Filter Tanggal Selesai */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Selesai</label>
							<input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2" value={filters.tanggalSelesai} onChange={e => setFilters(f => ({ ...f, tanggalSelesai: e.target.value }))} />
						</div>
					</div>
					<div className="flex justify-end mt-4">
						<button className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg" onClick={handleResetFilter} type="button">Reset Filter</button>
					</div>
				</div>

				{/* Results Info */}
				<div className="flex justify-between items-center text-sm text-gray-600 mb-4">
					<span>Menampilkan {indexOfFirstReport + 1}-{Math.min(indexOfLastReport, filteredReports.length)} dari {filteredReports.length} laporan</span>
				</div>

				{/* Reports Table */}
				<div className="bg-white rounded-lg shadow overflow-hidden">
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jenis Laporan</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pos</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{currentReports.length === 0 ? (
									<tr>
										<td colSpan="4" className="px-6 py-4 text-center text-gray-500">
											{reports.length === 0 ? 'Tidak ada laporan yang sudah ditandatangani' : 'Tidak ada laporan yang sesuai dengan filter'}
										</td>
									</tr>
								) : (
									currentReports.map(report => (
										<tr key={`${report.modelName}-${report.id}`} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleReportClick(report)}>
											<td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900">{report.type}</div></td>
											<td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900">{report.lokasi || '-'}</div></td>
											<td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900">{formatDate(report.tanggal)}</div></td>
											<td className="px-6 py-4 whitespace-nowrap"><button className="text-blue-600 hover:text-blue-900 font-medium">Lihat Preview</button></td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				</div>

				{/* Pagination */}
				{totalPages > 1 && (
					<div className="mt-6 flex items-center justify-between">
						<div className="flex items-center space-x-2">
							<button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Sebelumnya</button>
							<span className="text-sm text-gray-700">Halaman {currentPage} dari {totalPages}</span>
							<button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Selanjutnya</button>
						</div>
					</div>
				)}

				{/* Summary */}
				<div className="mt-6 bg-white rounded-lg shadow p-4">
					<p className="text-sm text-gray-600">Total laporan yang sudah ditandatangani: <span className="font-semibold text-green-600">{reports.length}</span></p>
				</div>
			</div>
		</div>
	);
};

export default AsChiefSignedReports; 