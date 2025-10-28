import express from "express";

import { exportLogbookHarianMasterPDF, previewLogbookHarianMasterHTML, previewLogbookHarianMasterPDFInline, exportLogbookHarianMasterPDFcobakit } from "../controllers/logbook_harian_master_pdf.js";
import { verifyToken } from "../middleware/auth.js";
const router = express.Router();


// GET /api/logbook-harian-master/export-pdf?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&lokasi=Chief Terminal Protection
// GET /api/logbook-harian-master/export-pdf?id=123
router.get("/export-pdf", verifyToken, exportLogbookHarianMasterPDF);

// GET /api/logbook-harian-master/preview-html?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&lokasi=Chief Terminal Protection
// GET /api/logbook-harian-master/preview-html?id=123
router.get("/preview-html", verifyToken, previewLogbookHarianMasterHTML);

// GET /api/logbook-harian-master/preview-pdf-inline?id=123
// GET /api/logbook-harian-master/preview-pdf-inline?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&lokasi=Chief Terminal Protection
router.get("/preview-pdf", verifyToken, previewLogbookHarianMasterPDFInline);

//JUST TEST
router.get("/export-pdf-devkit", verifyToken, exportLogbookHarianMasterPDFcobakit);

export default router;
