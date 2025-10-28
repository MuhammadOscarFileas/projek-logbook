import { DataTypes } from "sequelize";
import db from "../config/database.js";

const LogbookHarianMaster = db.define(
  "logbook_harian_master",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    tanggal: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    shift: {
      type: DataTypes.ENUM("Pagi (07:00 - 13:00)", "Siang (13:00 - 19:00)", "Malam (19:00 - 07:00)"),
      allowNull: false,
    },
    regu: {
      type: DataTypes.ENUM("Regu A", "Regu B", "Regu C", "Regu D"),
      allowNull: true,
    },
    bandara: {
      type: DataTypes.ENUM("Yogyakarta International Airport", "Jendral Ahmad Yani International Airport", "Adisutjipto Airport", "Adi Soemarmo International Airport", "Jendral Besar Soedirman Airport", "Juanda International Airport", "Dhoho International Airport"),
      allowNull: true,
    },
    pos: {
      type: DataTypes.ENUM("Screening", "Terminal Protection", "Non-Terminal Protection"),
      allowNull: true,
    },
    lokasi: {
      type: DataTypes.ENUM("Chief Terminal Protection", 
                          "Ruang Tunggu", 
                          "Walking Patrol", 
                          "Mezzanine Domestik", 
                          "Kedatangan Domestik", 
                          "Akses Karyawan", 
                          "Bulding Protection", 
                          "CCTV", 
                          "Main Gate", 
                          "Chief Non-Terminal Protection", 
                          "Patroli Landside",
                          "Patroli Airside", 
                          "Kargo Domestik",
                          "Kargo International", 
                          "Papa November", 
                          "Pos Congot", 
                          "PSCP", 
                          "Level 4", 
                          "HBS (Level 2/3)", 
                          "SCP LAGs", 
                          "SSCP", 
                          "OOG",
                          "Chief Screening",),
      allowNull: false,
    },
    nama_yg_menyerahkan: {
      type: DataTypes.STRING,
      allowNull: true,
    },  
    ttd_yg_menyerahkan: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    nama_yg_menerima: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ttd_yg_menerima: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    nama_chief: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ttd_chief: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("Draft", "Submitted", "Completed"),
      allowNull: false,
    },
  },
  {
    timestamps: false,
  }
);

export default LogbookHarianMaster; 