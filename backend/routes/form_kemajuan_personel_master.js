import express from "express";
import {
  createFormKemajuanPersonelMaster,
  getAllFormKemajuanPersonelMaster,
  getFormKemajuanPersonelMasterById,
  updateFormKemajuanPersonelMaster,
  deleteFormKemajuanPersonelMaster
} from "../controllers/form_kemajuan_personel_master.js";
import { verifyToken } from "../middleware/auth.js";


const router = express.Router();

router.post("/",verifyToken, createFormKemajuanPersonelMaster);
router.get("/",verifyToken, getAllFormKemajuanPersonelMaster);
router.get("/:id",verifyToken, getFormKemajuanPersonelMasterById);
router.put("/:id",verifyToken, updateFormKemajuanPersonelMaster);
router.delete("/:id",verifyToken, deleteFormKemajuanPersonelMaster);

export default router; 