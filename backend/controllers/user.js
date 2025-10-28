import User from "../models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";

export const countUserByRole = async (req, res) => {
  try {
    const superadmin = await User.count({ where: { role: "superadmin" } });
    const chief = await User.count({ where: { role: "chief" } });
    const officer = await User.count({ where: { role: "officer" } });
    res.json({ superadmin, chief, officer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const { password, ...otherData } = req.body;
    
    // Hash password if provided
    let userData = otherData;
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      userData = { ...otherData, password: hashedPassword };
    }
    
    const data = await User.create(userData);
    
    // Get created user data without password
    const createdUser = await User.findByPk(data.user_id, {
      attributes: { exclude: ['password'] }
    });
    
    res.status(201).json({ 
      msg: "User berhasil dibuat", 
      data: createdUser 
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getAllUser = async (req, res) => {
  try {
    const data = await User.findAll();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const data = await User.findByPk(req.params.id);
    if (!data) return res.status(404).json({ error: "Data not found" });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { password, ...otherData } = req.body;
    
    // Hash password if provided
    let updateData = otherData;
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData = { ...otherData, password: hashedPassword };
    }
    
    // Check if user exists
    const existingUser = await User.findByPk(req.params.id);
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Update user data
    await User.update(updateData, { where: { user_id: req.params.id } });
    
    // Get updated user data (without password)
    const updatedUser = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });
    
    res.json({ 
      message: "Data updated successfully", 
      data: updatedUser 
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const deleted = await User.destroy({ where: { user_id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: "Data not found" });
    res.json({ message: "Data deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const register = async (req, res) => {
  try {
    const { nama_lengkap, email, password, ...rest } = req.body;

    // Check if user already exists
    // const existingUser = await User.findOne({ where: { email } });
    // if (existingUser) {
    //   return res.status(400).json({ error: "Email sudah terdaftar" });
    // }

    const existingNama = await User.findOne({ where: { nama_lengkap } });
    if (existingNama) {
      return res.status(400).json({ error: "Nama lengkap ini sudah terdaftar" });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Simpan user dengan password yang sudah di-hash
    const data = await User.create({
      nama_lengkap,
      email,
      password: hashedPassword,
      ...rest
    });

    // Generate JWT token
    const accessToken = jwt.sign(
      { 
        id: data.user_id, 
        email: data.email, 
        role: data.role,
        nama_lengkap: data.nama_lengkap
      }, 
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "10h" }
    );

    res.status(201).json({
      message: "Register success",
      token: accessToken,
      data: { 
        user_id: data.user_id,
        nama_lengkap: data.nama_lengkap, 
        email: data.email,
        role: data.role
      }
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { identifier, nip, nama_lengkap, password } = req.body;
    
    // Determine login identifier - prioritize 'identifier' field, then 'nip', then 'nama_lengkap'
    let loginIdentifier = identifier || nip || nama_lengkap;
    
    if (!loginIdentifier || !password) {
      return res.status(400).json({ 
        error: "Login memerlukan identifier (NIP atau nama lengkap) dan password" 
      });
    }
    
    // Search user by NIP or nama_lengkap using OR condition
    const user = await User.findOne({ 
      where: { 
        [Op.or]: [
          { nip: loginIdentifier },
          { nama_lengkap: loginIdentifier }
        ]
      } 
    });
    
    if (!user) return res.status(404).json({ error: "User tidak ditemukan" });
    
    // Compare password with hashed password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ error: "Password salah" });
    
    // Generate JWT token
    const accessToken = jwt.sign(
      { 
        id: user.user_id, 
        email: user.email, 
        role: user.role,
        nama_lengkap: user.nama_lengkap
      }, 
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1h" }
    );
    
    res.json({ 
      message: "Login berhasil", 
      token: accessToken,
      user: {
        user_id: user.user_id,
        nip: user.nip,
        nama_lengkap: user.nama_lengkap,
        email: user.email,
        role: user.role,
        lokasi: user.lokasi,
        pos: user.pos,
        bandara: user.bandara,
        shift: user.shift,
        first_login: user.first_login
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 