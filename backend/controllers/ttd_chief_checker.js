import LogbookHarianMaster from "../models/logbook_harian_master.js";
import { Op } from "sequelize";

// GET /api/ttd-supervisor-kosong/:nama
export const getTtdChiefKosong = async (req, res) => {
  const nama = req.params.nama;
  try {
    const where = {
      ttd_chief: { [Op.or]: [null, ""] }
    };
    if (nama) {
      where["nama_petugas"] = nama;
    }
    const data = await LogbookHarianMaster.findAll({ where });
    res.json({ total: data.length, laporan: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/laporan-belum-ttd-chief/:nama
export const getLaporanBelumTtdChiefByNama = async (req, res) => {
  const nama = req.params.nama;
  try {
    const where = {
      nama_chief: nama,
      ttd_chief: { [Op.or]: [null, ""] }
    };
    const data = await LogbookHarianMaster.findAll({ where });
    res.json({ total: data.length, laporan: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/logbook-harian-master/belum-ttd-supervisor/:nama
export const getLogbookHarianMasterBelumTtdChief = async (req, res) => {
  const nama = req.params.nama;
  try {
    const data = await LogbookHarianMaster.findAll({
      where: {
        nama_chief: nama,
        status: "Submitted",
        ttd_chief: { [Op.or]: [null, ""] }
      }
    });
    res.json({ total: data.length, laporan: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/logbook-harian-master/sudah-ttd-supervisor/:nama
export const getLogbookHarianMasterSudahTtdChief = async (req, res) => {
  const nama = req.params.nama;
  try {
    const data = await LogbookHarianMaster.findAll({
      where: {
        nama_chief: nama,
        ttd_chief: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: "" }] },
        status: "Completed",
      }
    });
    res.json({ total: data.length, laporan: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/logbook-harian-master/count-belum-ttd-supervisor/:nama
export const countLogbookHarianMasterBelumTtdChief = async (req, res) => {
  const nama = req.params.nama;
  try {
    const count = await LogbookHarianMaster.count({
      where: {
        nama_chief: nama,
        ttd_chief: { [Op.or]: [null, ""] },
        status: "Submitted"
      }
    });
    res.json({ total: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/logbook-harian-master-chief-by-lokasi/:lokasi
export const getLogbookHarianMasterChiefByLokasi = async (req, res) => {
  const lokasi = req.params.lokasi;
  try {
    let posFilter;
    
    // Map lokasi parameter to pos values
    console.log(lokasi)
    switch (lokasi) {
      case "Terminal Protection":
        posFilter = "Terminal Protection";
        break;
      case "Non-Terminal Protection":
        posFilter = "Non-Terminal Protection";
        break;
      case "Screening":
        posFilter = "Screening";
        break;
      default:
        return res.status(400).json({ 
          error: "Lokasi tidak valid" 
        });
    }

    const data = await LogbookHarianMaster.findAll({
      where: {
        pos: posFilter,
        nama_chief: { [Op.ne]: null }, // Only records that have a chief assigned
        status: { [Op.or]: ["Submitted", "Completed"] }
      },
      order: [['tanggal', 'DESC'], ['id', 'DESC']]
    });
    
    res.json({ 
      total: data.length, 
      lokasi: lokasi,
      pos: posFilter,
      laporan: data 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};