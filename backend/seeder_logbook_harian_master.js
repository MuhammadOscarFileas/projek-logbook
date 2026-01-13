import LogbookHarianMaster from './models/logbook_harian_master.js';
import UraianTugas from './models/uraian_tugas.js';
import UraianInventaris from './models/uraian_inventaris.js';
import db from './config/database.js';

// Definisikan relasi untuk seeder (menghindari circular dependency dari association.js)
LogbookHarianMaster.hasMany(UraianTugas, { foreignKey: "logbook_harian_master_id", as: "uraian_tugas_list" });
LogbookHarianMaster.hasMany(UraianInventaris, { foreignKey: "logbook_harian_master_id", as: "uraian_inventaris_list" });

// Data dummy untuk logbook_harian_master
const logbookData = {
    tanggal: new Date().toISOString().split('T')[0], // Tanggal hari ini (format YYYY-MM-DD)
    shift: "Pagi (07:00 - 13:00)",
    regu: "Regu A",
    bandara: "Yogyakarta International Airport",
    pos: "Screening",
    lokasi: "Chief Screening",
    nama_yg_menyerahkan: "Budi Santoso",
    ttd_yg_menyerahkan: null, // Signature biasanya berupa base64 image, bisa diisi null untuk dummy
    nama_yg_menerima: "Ahmad Wijaya",
    ttd_yg_menerima: null,
    nama_chief: "Arik Candra Santoso",
    ttd_chief: null,
    status: "Draft"
};

// Data dummy untuk uraian_tugas (relasi dengan logbook_harian_master)
const uraianTugasData = [
    {
        jam_mulai: "07:00:00",
        jam_akhir: "08:30:00",
        uraian_tugas: "Melakukan pemeriksaan keamanan di area screening domestik",
        keterangan: "Semua penumpang dan barang diperiksa sesuai prosedur"
    },
    {
        jam_mulai: "08:30:00",
        jam_akhir: "10:00:00",
        uraian_tugas: "Monitoring CCTV di area terminal",
        keterangan: "Tidak ada kejadian mencurigakan"
    },
    {
        jam_mulai: "10:00:00",
        jam_akhir: "11:30:00",
        uraian_tugas: "Patroli di area ruang tunggu",
        keterangan: "Kondisi aman dan terkendali"
    },
    {
        jam_mulai: "11:30:00",
        jam_akhir: "13:00:00",
        uraian_tugas: "Melakukan briefing dan dokumentasi laporan",
        keterangan: "Semua tugas shift pagi telah selesai"
    }
];

// Data dummy untuk uraian_inventaris (relasi dengan logbook_harian_master)
const uraianInventarisData = [
    {
        nama_inventaris: "Walk Through Metal Detector",
        jumlah: 2,
        keterangan: "Kondisi baik, berfungsi normal"
    },
    {
        nama_inventaris: "Hand Held Metal Detector",
        jumlah: 4,
        keterangan: "Semua berfungsi dengan baik"
    },
    {
        nama_inventaris: "X-Ray Machine",
        jumlah: 1,
        keterangan: "Beroperasi normal"
    },
    {
        nama_inventaris: "Radio Communication",
        jumlah: 6,
        keterangan: "Semua unit berfungsi"
    }
];

async function seedLogbookHarianMaster() {
    try {
        console.log('Memulai seeding logbook_harian_master...');
        
        // Test koneksi database
        await db.authenticate();
        console.log('Koneksi database berhasil.');
        
        // Sync model (opsional, untuk memastikan tabel ada)
        // await db.sync({ alter: true });
        
        // Buat logbook_harian_master
        const logbook = await LogbookHarianMaster.create(logbookData);
        console.log(`Logbook harian master berhasil dibuat dengan ID: ${logbook.id}`);
        
        // Buat uraian_tugas dengan relasi ke logbook
        const uraianTugasPromises = uraianTugasData.map(uraian => 
            UraianTugas.create({
                ...uraian,
                logbook_harian_master_id: logbook.id
            })
        );
        const createdUraianTugas = await Promise.all(uraianTugasPromises);
        console.log(`${createdUraianTugas.length} uraian tugas berhasil dibuat`);
        
        // Buat uraian_inventaris dengan relasi ke logbook
        const uraianInventarisPromises = uraianInventarisData.map(inventaris => 
            UraianInventaris.create({
                ...inventaris,
                logbook_harian_master_id: logbook.id
            })
        );
        const createdUraianInventaris = await Promise.all(uraianInventarisPromises);
        console.log(`${createdUraianInventaris.length} uraian inventaris berhasil dibuat`);
        
        // Tampilkan data yang telah dibuat dengan relasinya
        const logbookWithRelations = await LogbookHarianMaster.findByPk(logbook.id, {
            include: [
                { model: UraianTugas, as: "uraian_tugas_list" },
                { model: UraianInventaris, as: "uraian_inventaris_list" }
            ]
        });
        
        console.log('\n=== Data Logbook yang Berhasil Dibuat ===');
        console.log(JSON.stringify(logbookWithRelations, null, 2));
        
        console.log('\n✅ Seeding logbook_harian_master berhasil!');
        
    } catch (error) {
        console.error('❌ Error saat seeding logbook_harian_master:', error);
        if (error.errors) {
            error.errors.forEach(err => {
                console.error(`- ${err.message} (field: ${err.path})`);
            });
        }
    } finally {
        // Tutup koneksi database
        await db.close();
        console.log('Koneksi database ditutup.');
    }
}

// Jalankan seeder
seedLogbookHarianMaster();
