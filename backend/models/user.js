import { DataTypes } from "sequelize";
import db from "../config/database.js";

const UserModel = db.define(
  "user",
  {
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    nip: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    nama_lengkap: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lokasi: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    pos: {
      type: DataTypes.ENUM("Screening", "Terminal Protection", "Non-Terminal Protection"),
      allowNull: true,
    },
    shift: {
      type: DataTypes.ENUM("Pagi (07:00 - 13:00)", "Siang (13:00 - 19:00)", "Malam (19:00 - 07:00)"),
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM("superadmin", "admin", "chief", "officer", "assistant_chief"),
      allowNull: false,
    },
    bandara: {
      type: DataTypes.ENUM("Yogyakarta International Airport", "Jendral Ahmad Yani International Airport", "Adisutjipto Airport", "Adi Soemarmo International Airport", "Jendral Besar Soedirman Airport", "Juanda International Airport", "Dhoho International Airport"),
      allowNull: true,
    },
    first_login: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

export default UserModel; 