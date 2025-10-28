import express from "express";
import {
  createLogbookHarianMaster,
  getAllLogbookHarianMaster,
  getLogbookHarianMasterById,
  updateLogbookHarianMaster,
  deleteLogbookHarianMaster,
  getAllLogbookByLokasi,
  getAllLogbookLokasiList,
  getLogbookHarianMasterByIdWithDetails,
  getSubmittedAndCompletedLogbookHarianMaster
} from "../controllers/logbook_harian_master.js";
import { verifyToken } from "../middleware/auth.js";
// Get all logbook with status Submitted or Completed
// Get logbook by id beserta uraian tugas & inventaris

const router = express.Router();

router.get("/submitted-completed", verifyToken, getSubmittedAndCompletedLogbookHarianMaster);
router.get("/detail/:id", verifyToken, getLogbookHarianMasterByIdWithDetails);
// List all possible lokasi
router.get("/lokasi-list", verifyToken, getAllLogbookLokasiList);
// Get all logbook by lokasi (dynamic)
router.get("/harian/:lokasi", verifyToken, getAllLogbookByLokasi);
router.post("/", verifyToken, createLogbookHarianMaster);
router.get("/", verifyToken, getAllLogbookHarianMaster);
router.get("/:id", verifyToken, getLogbookHarianMasterById);
router.put("/:id", verifyToken, updateLogbookHarianMaster);
router.delete("/:id", verifyToken, deleteLogbookHarianMaster);

export default router; 