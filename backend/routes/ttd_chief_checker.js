import express from "express";
import { getTtdChiefKosong, getLaporanBelumTtdChiefByNama, getLogbookHarianMasterBelumTtdChief, getLogbookHarianMasterSudahTtdChief, countLogbookHarianMasterBelumTtdChief, getLogbookHarianMasterChiefByLokasi } from "../controllers/ttd_chief_checker.js";

import { verifyToken } from "../middleware/auth.js";
const router = express.Router();

// GET /api/ttd-supervisor-kosong/:nama
router.get("/logbook-harian-master/count-belum-ttd-chief/:nama", verifyToken, countLogbookHarianMasterBelumTtdChief);
router.get("/sudah-ttd-chief/:nama", verifyToken, getLogbookHarianMasterSudahTtdChief);
router.get("/laporan-belum-ttd-chief/:nama", verifyToken, getLogbookHarianMasterBelumTtdChief);
router.get("/ttd-chief-kosong/:nama", verifyToken, getTtdChiefKosong);
router.get("/logbook-harian-master-chief/:lokasi", verifyToken, getLogbookHarianMasterChiefByLokasi);
//router.get("/laporan-belum-ttd-supervisor/:nama", getLogbookHarianMasterBelumTtdSupervisor);

export default router