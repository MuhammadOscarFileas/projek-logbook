import { DataTypes } from "sequelize";
import db from "../config/database.js";

const FormKemajuanPersonelMaster = db.define(
  "form_kemajuan_personel_master",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    unit: {
      type: DataTypes.ENUM("Terminal Protection", "Non-Terminal Protection", "Screening"),
      allowNull: false,
    },
    hari_tanggal: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    bandara: {
      type: DataTypes.ENUM("Yogyakarta International Airport", "Jendral Ahmad Yani International Airport", "Adisutjipto Airport", "Adi Soemarmo International Airport", "Jendral Besar Soedirman Airport", "Juanda International Airport", "Dhoho International Airport"),
      allowNull: true,
    },
    shift: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    pleton: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    jumlah_personil: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    jumlah_kekuatan: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    keterangan: {
      type: DataTypes.TEXT, 
      allowNull: true,
    },
    nama_chief: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ttd_chief: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    timestamps: false,
  }
);

export default FormKemajuanPersonelMaster; 