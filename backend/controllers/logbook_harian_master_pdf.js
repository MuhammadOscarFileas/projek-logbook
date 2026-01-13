import puppeteer from "puppeteer";
import pdf from 'html-pdf';
import LogbookHarianMaster from "../models/logbook_harian_master.js";
import UraianTugas from "../models/uraian_tugas.js";
import UraianInventaris from "../models/uraian_inventaris.js";
import { Op } from "sequelize";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

/**
 * Logbook Harian Master PDF Controller
 * 
 * Endpoints yang tersedia:
 * 1. GET /api/logbook-harian-master-pdf/export-pdf
 *    - Export laporan ke PDF
 *    - Parameters: 
 *      * id (single report) - untuk export satu laporan berdasarkan ID
 *      * start_date & end_date (range reports) - untuk export multiple laporan berdasarkan rentang tanggal
 *      * lokasi (optional filter) - hanya digunakan bersama start_date & end_date untuk filter berdasarkan lokasi
 *    - Response: PDF file
 * 
 * 2. GET /api/logbook-harian-master-pdf/preview-html
 *    - Preview laporan dalam format HTML
 *    - Parameters: 
 *      * id (single report) - untuk preview satu laporan berdasarkan ID
 *      * start_date & end_date (range reports) - untuk preview multiple laporan berdasarkan rentang tanggal
 *      * lokasi (optional filter) - hanya digunakan bersama start_date & end_date untuk filter berdasarkan lokasi
 *    - Response: HTML page untuk preview
 * 
 * Contoh penggunaan:
 * - Single report: /api/logbook-harian-master-pdf/preview-html?id=123
 * - Range reports: /api/logbook-harian-master-pdf/preview-html?start_date=2024-01-01&end_date=2024-01-31
 * - Range reports with location filter: /api/logbook-harian-master-pdf/preview-html?start_date=2024-01-01&end_date=2024-01-31&lokasi=Chief Terminal Protection
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to convert image to base64
function imageToBase64(imagePath) {
  try {
    const imageBuffer = fs.readFileSync(imagePath);
    const base64String = imageBuffer.toString('base64');
    const extension = path.extname(imagePath).substring(1);
    return `data:image/${extension};base64,${base64String}`;
  } catch (error) {
    console.error(`Error reading image ${imagePath}:`, error);
    return null;
  }
}

function formatTanggalWithDay(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  // Format: e.g. "Senin, 01 Januari 2024"
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function laporanToHTML(laporan, uraianTugas, uraianInventaris) {
  const assetsPath = path.join(__dirname, "../assets");
  const yialogoPath = path.join(assetsPath, "yialogo.png");
  const injourneylogoPath = path.join(assetsPath, "injourneylogo.png");
  const injourneyjustPath = path.join(assetsPath, "injourneyjust.png");

  const yialogoBase64 = imageToBase64(yialogoPath);
  const injourneylogoBase64 = imageToBase64(injourneylogoPath);
  const injourneyjustBase64 = imageToBase64(injourneyjustPath);

  return `
    <div class="laporan-page">

      
      <!-- Header with logos -->
      <div class="header-section">
        <div class="header-left">
          ${injourneylogoBase64 ? `<img src="${injourneylogoBase64}" class="header-logo" alt="InJourney Logo"/>` : '<div class="logo-placeholder">InJourney Logo</div>'}
        </div>
        <div class="header-right">
          ${yialogoBase64 ? `<img src="${yialogoBase64}" class="header-logo" alt="YIA Logo"/>` : '<div class="logo-placeholder">YIA Logo</div>'}
        </div>
      </div>
      <div class="header-info">
        <div><b>UNIT / POS</b>: ${laporan.pos} - ${laporan.lokasi}</div>
        <div><b>HARI / TANGGAL</b> : ${formatTanggalWithDay(laporan.tanggal)}</div>
        <div><b>REGU / SHIFT</b> : ${laporan.shift || "-"}</div>
      </div>
      <br/>
      ${uraianInventaris.length > 0 ? `
        <table class="inventaris-table">
          <thead>
            <tr>
              <th class="col-no">No</th>
              <th class="col-nama">Nama Inventaris</th>
              <th class="col-jumlah">Jumlah</th>
              <th class="col-keterangan">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            ${uraianInventaris.map((inv, i) => `
              <tr>
                <td class="col-no">${i + 1}</td>
                <td class="col-nama">${inv.nama_inventaris}</td>
                <td class="col-jumlah">${inv.jumlah}</td>
                <td class="col-keterangan">${inv.keterangan || "-"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      ` : ''}
      <br/>
      <table class="tugas-table">
        <thead style="background-color: #ffffff;">
          <tr>
            <th class="col-no">No</th>
            <th class="col-jam">Jam</th>
            <th class="col-uraian">Uraian Tugas</th>
            <th class="col-keterangan">Keterangan</th>
          </tr>
        </thead>
        <tbody>
          ${uraianTugas.map((tugas, i) => `
            <tr>
              <td class="col-no">${i + 1}</td>
              <td class="col-jam">${tugas.jam_mulai} - ${tugas.jam_akhir}</td>
              <td class="col-uraian">${tugas.uraian_tugas}</td>
              <td class="col-keterangan">${tugas.keterangan || ""}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      ${laporan.lokasi === "Chief Terminal Protection" || laporan.lokasi === "Chief Non-Terminal Protection" || laporan.lokasi === "Chief Screening" ? 
        // TTD untuk Chief positions (hanya menyerahkan dan menerima)
        `<table class="ttd-table" width="100%">
          <tr>
            <td class="ttd-header">Pembuat</td>
            <td class="ttd-header">Penerima</td>
          </tr>
          <tr>
            <td class="ttd-cell">
              ${laporan.ttd_yg_menyerahkan ? `<img src="${laporan.ttd_yg_menyerahkan}" class="ttd-signature"/><br/>` : "<br/><br/><br/>"}
              <div class="ttd-name">${laporan.nama_yg_menyerahkan || "-"}</div>
            </td>
            <td class="ttd-cell">
              ${laporan.ttd_yg_menerima ? `<img src="${laporan.ttd_yg_menerima}" class="ttd-signature"/><br/>` : "<br/><br/><br/>"}
              <div class="ttd-name">${laporan.nama_yg_menerima || "-"}</div>
            </td>
          </tr>
        </table>`
        : 
        // TTD untuk posisi lain (menyerahkan, menerima, dan chief)
        `<table class="ttd-table" width="100%">
          <tr>
            <td class="ttd-header">Pembuat</td>
            <td class="ttd-header">Penerima</td>
            <td class="ttd-header">Assistant Chief ${laporan.pos}</td>
          </tr>
          <tr>
            <td class="ttd-cell">
              ${laporan.ttd_yg_menyerahkan ? `<img src="${laporan.ttd_yg_menyerahkan}" class="ttd-signature"/><br/>` : "<br/><br/><br/>"}
              <div class="ttd-name">${laporan.nama_yg_menyerahkan || "-"}</div>
            </td>
            <td class="ttd-cell">
              ${laporan.ttd_yg_menerima ? `<img src="${laporan.ttd_yg_menerima}" class="ttd-signature"/><br/>` : "<br/><br/><br/>"}
              <div class="ttd-name">${laporan.nama_yg_menerima || "-"}</div>
            </td>
            <td class="ttd-cell">
              ${laporan.ttd_chief ? `<img src="${laporan.ttd_chief}" class="ttd-signature"/><br/>` : "<br/><br/><br/>"}
              <div class="ttd-name">${laporan.nama_chief || "-"}</div>
            </td>
          </tr>
        </table>`
      }
    </div>
  `;
}

export const exportLogbookHarianMasterPDF = async (req, res) => {
  try {
    const { id, start_date, end_date, lokasi } = req.query;
    let html = "";
    let filename = "logbook_harian_master.pdf";

    if (id) {
      // Mode 1: Berdasarkan id (parameter lokasi diabaikan untuk single report)
      const laporan = await LogbookHarianMaster.findByPk(id, {
        include: [
          { model: UraianTugas, as: "uraian_tugas_list" },
          { model: UraianInventaris, as: "uraian_inventaris_list" },
        ],
      });
      if (!laporan) return res.status(404).json({ error: "Laporan tidak ditemukan" });
      html = laporanToHTML(laporan, laporan.uraian_tugas_list || [], laporan.uraian_inventaris_list || []);
      filename = `logbook_harian_master_${id}.pdf`;
    } else if (start_date && end_date) {
      //debug console.log("sampe sini 0")
      // Mode 2: Berdasarkan rentang tanggal dengan filter lokasi (optional)
      const whereCondition = {
        tanggal: { [Op.between]: [start_date, end_date] },
      };
      //debug console.log("sampe sini 1")
      // Tambahkan filter lokasi jika parameter lokasi ada (hanya untuk range reports)
      if (lokasi) {
        whereCondition.lokasi = lokasi;
      }
      
      //debug console.log("sampe sini 2")
      const laporanList = await LogbookHarianMaster.findAll({
        where: whereCondition,
        order: [["tanggal", "ASC"]],
        include: [
          { model: UraianTugas, as: "uraian_tugas_list" },
          { model: UraianInventaris, as: "uraian_inventaris_list" },
        ],
      });
      //debug console.log(lokasi)
      if (!laporanList.length) return res.status(404).json({ error: "Tidak ada laporan di rentang tanggal tersebut" });
      html = laporanList.map((laporan, idx) => `
        ${laporanToHTML(laporan, laporan.uraian_tugas_list || [], laporan.uraian_inventaris_list || [])}
      `).join("");
      filename = `logbook_harian_master_${start_date}_-_${end_date}${lokasi ? `_${lokasi}` : ''}.pdf`;
    } else {
      return res.status(400).json({ error: "Parameter id atau start_date & end_date diperlukan" });
    }

    // Bungkus HTML dengan style global
    const assetsPath = path.join(__dirname, "../assets");
    const injourneyjustPath = path.join(assetsPath, "injourneyjust.png");
    const injourneyjustBase64 = imageToBase64(injourneyjustPath);

    const fullHtml = `
      <html>
      <head>
        <style>
          @page {
            margin: 1in;
          }
          body, table, th, td, div, span, p { 
            font-family: Arial, sans-serif; 
            font-size: 11px; 
          }
          body { 
            margin: 0;
            padding: 0;
          }
          .laporan-page { 
            position: relative;
            page-break-after: always;
          }
          
          /* Header Section */
          .header-section { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-bottom: 20px; 
            padding-bottom: 10px;
            border-bottom: 1px solid #ccc;
          }
          .header-left, .header-right { 
            flex: 1; 
            text-align: center;
          }
          .header-left { text-align: left; }
          .header-right { text-align: right; }
          .header-logo { 
            max-height: 60px; 
            max-width: 200px;
            object-fit: contain;
          }
          .logo-placeholder {
            max-height: 60px;
            max-width: 200px;
            background-color: #f0f0f0;
            display: flex;
            justify-content: center;
            align-items: center;
            color: #555;
            font-size: 14px;
            font-weight: bold;
            border: 1px dashed #ccc;
            padding: 10px;
          }
          
          /* Header Info */
          .header-info div { margin-bottom: 4px; }
          
          /* POS Title */
          .pos-title {
            text-align: center;
            margin: 20px 0 15px 0;
            padding: 10px 0;
            border-bottom: 2px solid #333;
          }
          .pos-title h2 {
            margin: 0;
            font-size: 18px;
            font-weight: bold;
            color: #333;
            text-transform: uppercase;
          }
          
          /* Tables */
          table { 
            border-collapse: collapse; 
            width: 100%; 
            margin-bottom: 16px; 
            table-layout: fixed;
          }
          th, td { 
            border: 1px solid #000; 
            padding: 4px 8px; 
            text-align: left; 
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          th { background: #eee; }
          
          /* Tugas Table */
          .tugas-table {
            table-layout: fixed;
            width: 100%;
          }
          .tugas-table .col-no { width: 8%; }
          .tugas-table .col-jam { width: 20%; }
          .tugas-table .col-uraian { width: 52%; }
          .tugas-table .col-keterangan { width: 20%; }
          
          /* Inventaris Table */
          .inventaris-table {
            table-layout: fixed;
            width: 100%;
          }
          .inventaris-table .col-no { width: 8%; }
          .inventaris-table .col-nama { width: 57%; }
          .inventaris-table .col-jumlah { width: 15%; } 
          .inventaris-table .col-keterangan { width: 20%; }
          
          /* TTD Table */
          .ttd-table { 
            margin-top: 20px;
            width: 100%;
          }
          .ttd-table .ttd-header { 
            border: none; 
            text-align: center; 
            padding: 8px;
            font-weight: bold;
            font-size: 12px;
          }
          .ttd-table .ttd-cell { 
            border: none; 
            text-align: center; 
            height: 120px; 
            vertical-align: top;
            padding: 10px 5px;
          }
          .ttd-signature {
            width: 120px;
            height: auto;
            margin-bottom: 5px;
          }
          .ttd-name {
            font-size: 11px;
            font-weight: bold;
            margin-top: 5px;
          }
          
          /* Watermark */
          .watermark { 
            position: fixed; 
            right: 10px; 
            bottom: 10px; 
            opacity: 0.30; 
            z-index: 1; 
            pointer-events: none;
          }
          .watermark-img { 
            max-width: 200px; 
            max-height: 200px;
            object-fit: contain;
          }
          .watermark-placeholder {
            max-width: 200px;
            max-height: 200px;
            background-color: #f0f0f0;
            display: flex;
            justify-content: center;
            align-items: center;
            color: #555;
            font-size: 12px;
            font-weight: bold;
            border: 1px dashed #ccc;
            padding: 5px;
            opacity: 0.50;
          }
        </style>
      </head>
      <body>
        <div class="watermark">
          ${injourneyjustBase64 ? `<img src="${injourneyjustBase64}" class="watermark-img" alt="InJourney Just"/>` : '<div class="watermark-placeholder">InJourney Just</div>'}
        </div>
        ${html}
      </body>
      </html>
    `;

    // Konversi HTML ke PDF pakai puppeteer
    const launchOptions = { headless: "new" };
    if (process.env.CHROME_PATH) {
      launchOptions.executablePath = process.env.CHROME_PATH;
    }
    
    const browser = await puppeteer.launch({
      executablePath: process.env.CHROME_PATH,
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
    await browser.close();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=${filename}`,
    });
    res.send(pdfBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const previewLogbookHarianMasterHTML = async (req, res) => {
  try {
    const { id, start_date, end_date, lokasi } = req.query;
    let html = "";

    if (id) {
      // Mode 1: Berdasarkan id (parameter lokasi diabaikan untuk single report)
      const laporan = await LogbookHarianMaster.findByPk(id, {
        include: [
          { model: UraianTugas, as: "uraian_tugas_list" },
          { model: UraianInventaris, as: "uraian_inventaris_list" },
        ],
      });
      if (!laporan) return res.status(404).json({ error: "Laporan tidak ditemukan" });
      html = laporanToHTML(laporan, laporan.uraian_tugas_list || [], laporan.uraian_inventaris_list || []);
    } else if (start_date && end_date) {
      // Mode 2: Berdasarkan rentang tanggal dengan filter lokasi (optional)
      const whereCondition = {
        tanggal: { [Op.between]: [start_date, end_date] },
      };
      
      // Tambahkan filter lokasi jika parameter lokasi ada (hanya untuk range reports)
      if (lokasi) {
        whereCondition.lokasi = lokasi;
      }
      
      const laporanList = await LogbookHarianMaster.findAll({
        where: whereCondition,
        order: [["tanggal", "ASC"]],
        include: [
          { model: UraianTugas, as: "uraian_tugas_list" },
          { model: UraianInventaris, as: "uraian_inventaris_list" },
        ],
      });
      if (!laporanList.length) return res.status(404).json({ error: "Tidak ada laporan di rentang tanggal tersebut" });
      html = laporanList.map((laporan, idx) => `
        ${laporanToHTML(laporan, laporan.uraian_tugas_list || [], laporan.uraian_inventaris_list || [])}
      `).join("");
    } else {
      return res.status(400).json({ error: "Parameter id atau start_date & end_date diperlukan" });
    }

    // Bungkus HTML dengan style global untuk preview
    const assetsPath = path.join(__dirname, "../assets");
    const injourneyjustPath = path.join(assetsPath, "injourneyjust.png");
    const injourneyjustBase64 = imageToBase64(injourneyjustPath);

    const fullHtml = `
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Preview Logbook Harian Master</title>
        <style>
          body, table, th, td, div, span, p { 
            font-family: Arial, sans-serif; 
            font-size: 11px; 
          }
          body { 
            margin: 1in;
            padding: 0;
            background-color: #f5f5f5;
          }
          .laporan-page { 
            /* page-break-after: always; */
            position: relative;
            /* min-height: 100vh; */
            background-color: white;
            margin-bottom: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 20px;
            border-radius: 5px;
          }
          
          /* Header Section */
          .header-section { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-bottom: 20px; 
            padding-bottom: 10px;
            border-bottom: 1px solid #ccc;
          }
          .header-left, .header-right { 
            flex: 1; 
            text-align: center;
          }
          .header-left { text-align: left; }
          .header-right { text-align: right; }
          .header-logo { 
            max-height: 60px; 
            max-width: 200px;
            object-fit: contain;
          }
          .logo-placeholder {
            max-height: 60px;
            max-width: 200px;
            background-color: #f0f0f0;
            display: flex;
            justify-content: center;
            align-items: center;
            color: #555;
            font-size: 14px;
            font-weight: bold;
            border: 1px dashed #ccc;
            padding: 10px;
          }
          
          /* Header Info */
          .header-info div { margin-bottom: 4px; }
          
          /* POS Title */
          .pos-title {
            text-align: center;
            margin: 20px 0 15px 0;
            padding: 10px 0;
            border-bottom: 2px solid #333;
          }
          .pos-title h2 {
            margin: 0;
            font-size: 18px;
            font-weight: bold;
            color: #333;
            text-transform: uppercase;
          }
          
          /* Tables */
          table { 
            border-collapse: collapse; 
            width: 100%; 
            margin-bottom: 16px; 
            table-layout: fixed;
          }
          th, td { 
            border: 1px solid #000; 
            padding: 4px 8px; 
            text-align: left; 
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          th { background: #eee; }
          
          /* Tugas Table */
          .tugas-table {
            table-layout: fixed;
            width: 100%;
          }
          .tugas-table .col-no { width: 8%; }
          .tugas-table .col-jam { width: 20%; }
          .tugas-table .col-uraian { width: 52%; }
          .tugas-table .col-keterangan { width: 20%; }
          
          /* Inventaris Table */
          .inventaris-table {
            table-layout: fixed;
            width: 100%;
          }
          .inventaris-table .col-no { width: 8%; }
          .inventaris-table .col-nama { width: 72%; }
          .inventaris-table .col-jumlah { width: 20%; }
          
          /* TTD Table */
          .ttd-table { 
            margin-top: 20px;
            width: 100%;
          }
          .ttd-table .ttd-header { 
            border: none; 
            text-align: center; 
            padding: 8px;
            font-weight: bold;
            font-size: 12px;
          }
          .ttd-table .ttd-cell { 
            border: none; 
            text-align: center; 
            height: 120px; 
            vertical-align: top;
            padding: 10px 5px;
          }
          .ttd-signature {
            width: 120px;
            height: auto;
            margin-bottom: 5px;
          }
          .ttd-name {
            font-size: 11px;
            font-weight: bold;
            margin-top: 5px;
          }
          
          /* Watermark */
          .watermark { 
            position: absolute; 
            right: 10px; 
            bottom: 10px; 
            opacity: 0.15; 
            z-index: 1; 
            pointer-events: none;
          }
          .watermark-img { 
            max-width: 200px; 
            max-height: 200px;
            object-fit: contain;
          }
          .watermark-placeholder {
            max-width: 200px;
            max-height: 200px;
            background-color: #f0f0f0;
            display: flex;
            justify-content: center;
            align-items: center;
            color: #555;
            font-size: 12px;
            font-weight: bold;
            border: 1px dashed #ccc;
            padding: 5px;
            opacity: 0.15;
          }

          /* Preview specific styles */
          @media print {
            @page {
              margin: 1in;
            }
            body {
              background-color: white;
              margin: 0;
            }
            .laporan-page {
              box-shadow: none;
              margin-bottom: 0;
              padding: 0;
              border-radius: 0;
              page-break-after: always;
            }
          }
        </style>
      </head>
      <body>
        <div class="watermark">
          ${injourneyjustBase64 ? `<img src="${injourneyjustBase64}" class="watermark-img" alt="InJourney Just"/>` : '<div class="watermark-placeholder">InJourney Just</div>'}
        </div>
        ${html}
      </body>
      </html>
    `;

    // Set response header untuk HTML
    res.set({
      "Content-Type": "text/html; charset=utf-8",
    });
    res.send(fullHtml);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const previewLogbookHarianMasterPDFInline = async (req, res) => {
  try {
    const { id, start_date, end_date, lokasi } = req.query;
    let html = "";
    let filename = "logbook_harian_master.pdf";

    if (id) {
      // Mode 1: Berdasarkan id (parameter lokasi diabaikan untuk single report)
      const laporan = await LogbookHarianMaster.findByPk(id, {
        include: [
          { model: UraianTugas, as: "uraian_tugas_list" },
          { model: UraianInventaris, as: "uraian_inventaris_list" },
        ],
      });
      if (!laporan) return res.status(404).json({ error: "Laporan tidak ditemukan" });
      html = laporanToHTML(laporan, laporan.uraian_tugas_list || [], laporan.uraian_inventaris_list || []);
      filename = `logbook_harian_master_${id}.pdf`;
    } else if (start_date && end_date) {
      // Mode 2: Berdasarkan rentang tanggal dengan filter lokasi (optional)
      const whereCondition = {
        tanggal: { [Op.between]: [start_date, end_date] },
      };
      
      // Tambahkan filter lokasi jika parameter lokasi ada (hanya untuk range reports)
      if (lokasi) {
        whereCondition.lokasi = lokasi;
      }
      
      const laporanList = await LogbookHarianMaster.findAll({
        where: whereCondition,
        order: [["tanggal", "ASC"]],
        include: [
          { model: UraianTugas, as: "uraian_tugas_list" },
          { model: UraianInventaris, as: "uraian_inventaris_list" },
        ],
      });
      if (!laporanList.length) return res.status(404).json({ error: "Tidak ada laporan di rentang tanggal tersebut" });
      html = laporanList.map((laporan, idx) => `
        ${laporanToHTML(laporan, laporan.uraian_tugas_list || [], laporan.uraian_inventaris_list || [])}
      `).join("");
      filename = `logbook_harian_master_${start_date}_to_${end_date}${lokasi ? `_${lokasi}` : ''}.pdf`;
    } else {
      return res.status(400).json({ error: "Parameter id atau start_date & end_date diperlukan" });
    }

    // Bungkus HTML dengan style global
    const assetsPath = path.join(__dirname, "../assets");
    const injourneyjustPath = path.join(assetsPath, "injourneyjust.png");
    const injourneyjustBase64 = imageToBase64(injourneyjustPath);

    const fullHtml = `
      <html>
      <head>
        <style>
          @page {
            margin: 1in;
          }
          body, table, th, td, div, span, p { 
            font-family: Arial, sans-serif; 
            font-size: 11px; 
          }
          body { 
            margin: 0;
            padding: 0;
          }
          .laporan-page { 
            page-break-after: always; 
            position: relative;
            min-height: 100vh;
          }
          
          /* Header Section */
          .header-section { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-bottom: 20px; 
            padding-bottom: 10px;
            border-bottom: 1px solid #ccc;
          }
          .header-left, .header-right { 
            flex: 1; 
            text-align: center;
          }
          .header-left { text-align: left; }
          .header-right { text-align: right; }
          .header-logo { 
            max-height: 60px; 
            max-width: 200px;
            object-fit: contain;
          }
          .logo-placeholder {
            max-height: 60px;
            max-width: 200px;
            background-color: #f0f0f0;
            display: flex;
            justify-content: center;
            align-items: center;
            color: #555;
            font-size: 14px;
            font-weight: bold;
            border: 1px dashed #ccc;
            padding: 10px;
          }
          
          /* Header Info */
          .header-info div { margin-bottom: 4px; }
          
          /* POS Title */
          .pos-title {
            text-align: center;
            margin: 20px 0 15px 0;
            padding: 10px 0;
            border-bottom: 2px solid #333;
          }
          .pos-title h2 {
            margin: 0;
            font-size: 18px;
            font-weight: bold;
            color: #333;
            text-transform: uppercase;
          }
          
          /* Tables */
          table { 
            border-collapse: collapse; 
            width: 100%; 
            margin-bottom: 16px; 
            table-layout: fixed;
          }
          th, td { 
            border: 1px solid #000; 
            padding: 4px 8px; 
            text-align: left; 
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          th { background: #eee; }
          
          /* Tugas Table */
          .tugas-table {
            table-layout: fixed;
            width: 100%;
          }
          .tugas-table .col-no { width: 8%; }
          .tugas-table .col-jam { width: 20%; }
          .tugas-table .col-uraian { width: 52%; }
          .tugas-table .col-keterangan { width: 20%; }
          
          /* Inventaris Table */
          .inventaris-table {
            table-layout: fixed;
            width: 100%;
          }
          .inventaris-table .col-no { width: 10%; }
          .inventaris-table .col-nama { width: 70%; }
          .inventaris-table .col-jumlah { width: 20%; }
          
          /* TTD Table */
          .ttd-table { 
            margin-top: 20px;
            width: 100%;
          }
          .ttd-table .ttd-header { 
            border: none; 
            text-align: center; 
            padding: 8px;
            font-weight: bold;
            font-size: 12px;
          }
          .ttd-table .ttd-cell { 
            border: none; 
            text-align: center; 
            height: 120px; 
            vertical-align: top;
            padding: 10px 5px;
          }
          .ttd-signature {
            width: 120px;
            height: auto;
            margin-bottom: 5px;
          }
          .ttd-name {
            font-size: 11px;
            font-weight: bold;
            margin-top: 5px;
          }
          
          /* Watermark */
          .watermark { 
            position: absolute; 
            right: 10px; 
            bottom: 10px; 
            opacity: 0.15; 
            z-index: 1; 
            pointer-events: none;
          }
          .watermark-img { 
            max-width: 200px; 
            max-height: 200px;
            object-fit: contain;
          }
          .watermark-placeholder {
            max-width: 200px;
            max-height: 200px;
            background-color: #f0f0f0;
            display: flex;
            justify-content: center;
            align-items: center;
            color: #555;
            font-size: 12px;
            font-weight: bold;
            border: 1px dashed #ccc;
            padding: 5px;
            opacity: 0.08;
          }
        </style>
      </head>
      <body>
        <div class="watermark">
          ${injourneyjustBase64 ? `<img src="${injourneyjustBase64}" class="watermark-img" alt="InJourney Just"/>` : '<div class="watermark-placeholder">InJourney Just</div>'}
        </div>
        ${html}
      </body>
      </html>
    `;

    // Konversi HTML ke PDF pakai puppeteer
    const launchOptions = { headless: "new" };
    if (process.env.CHROME_PATH) {
      launchOptions.executablePath = process.env.CHROME_PATH;
    }
    const browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
    await browser.close();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename=${filename}`,
    });
    res.send(pdfBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};


//TES htmlpdf
export const exportLogbookHarianMasterPDFcobakit = async (req, res) => {
  try {
    const { id, start_date, end_date, lokasi } = req.query;
    let html = "";
    let filename = "logbook_harian_master.pdf";

    if (id) {
      // Mode 1: Berdasarkan id (parameter lokasi diabaikan untuk single report)
      const laporan = await LogbookHarianMaster.findByPk(id, {
        include: [
          { model: UraianTugas, as: "uraian_tugas_list" },
          { model: UraianInventaris, as: "uraian_inventaris_list" },
        ],
      });
      if (!laporan) return res.status(404).json({ error: "Laporan tidak ditemukan" });
      html = laporanToHTML(laporan, laporan.uraian_tugas_list || [], laporan.uraian_inventaris_list || []);
      filename = `logbook_harian_master_${id}.pdf`;
    } else if (start_date && end_date) {
      // Mode 2: Berdasarkan rentang tanggal dengan filter lokasi (optional)
      const whereCondition = {
        tanggal: { [Op.between]: [start_date, end_date] },
      };
      
      // Tambahkan filter lokasi jika parameter lokasi ada (hanya untuk range reports)
      if (lokasi) {
        whereCondition.lokasi = lokasi;
      }
      
      const laporanList = await LogbookHarianMaster.findAll({
        where: whereCondition,
        order: [["tanggal", "ASC"]],
        include: [
          { model: UraianTugas, as: "uraian_tugas_list" },
          { model: UraianInventaris, as: "uraian_inventaris_list" },
        ],
      });
      if (!laporanList.length) return res.status(404).json({ error: "Tidak ada laporan di rentang tanggal tersebut" });
      html = laporanList.map((laporan, idx) => `
        ${laporanToHTML(laporan, laporan.uraian_tugas_list || [], laporan.uraian_inventaris_list || [])}
      `).join("");
      filename = `logbook_harian_master_${start_date}_to_${end_date}${lokasi ? `_${lokasi}` : ''}.pdf`;
    } else {
      return res.status(400).json({ error: "Parameter id atau start_date & end_date diperlukan" });
    }

    // Bungkus HTML dengan style global
    const assetsPath = path.join(__dirname, "../assets");
    const injourneyjustPath = path.join(assetsPath, "injourneyjust.png");
    const injourneyjustBase64 = imageToBase64(injourneyjustPath);

    const fullHtml = `
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @page {
            margin: 1in;
            size: A4;
          }
          body, table, th, td, div, span, p { 
            font-family: Arial, sans-serif; 
            font-size: 11px; 
            line-height: 1.2;
          }
          body { 
            margin: 0;
            padding: 0;
            background-color: white;
          }
          .laporan-page { 
            position: relative;
            page-break-after: always;
            min-height: 100vh;
          }
          
          /* Header Section */
          .header-section { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-bottom: 20px; 
            padding-bottom: 10px;
            border-bottom: 1px solid #ccc;
            width: 100%;
          }
          .header-left, .header-right { 
            flex: 1; 
            display: flex;
            align-items: center;
            height: 60px;
          }
          .header-left { 
            justify-content: flex-start; 
          }
          .header-right { 
            justify-content: flex-end; 
          }
          .header-logo { 
            max-height: 60px; 
            max-width: 200px;
            object-fit: contain;
            display: block;
          }
          .logo-placeholder {
            max-height: 60px;
            max-width: 200px;
            background-color: #f0f0f0;
            display: flex;
            justify-content: center;
            align-items: center;
            color: #555;
            font-size: 14px;
            font-weight: bold;
            border: 1px dashed #ccc;
            padding: 10px;
          }
          
          /* Header Info */
          .header-info div { 
            margin-bottom: 4px; 
            font-weight: normal;
          }
          
          /* POS Title */
          .pos-title {
            text-align: center;
            margin: 20px 0 15px 0;
            padding: 10px 0;
            border-bottom: 2px solid #333;
          }
          .pos-title h2 {
            margin: 0;
            font-size: 18px;
            font-weight: bold;
            color: #333;
            text-transform: uppercase;
          }
          
          /* Tables */
          table { 
            border-collapse: collapse; 
            width: 100%; 
            margin-bottom: 16px; 
            table-layout: fixed;
          }
          th, td { 
            border: 1px solid #000; 
            padding: 4px 8px; 
            text-align: left; 
            word-wrap: break-word;
            overflow-wrap: break-word;
            vertical-align: top;
          }
          th { 
            background: #eee; 
            font-weight: bold;
          }
          
          /* Tugas Table */
          .tugas-table {
            table-layout: fixed;
            width: 100%;
          }
          .tugas-table .col-no { width: 8%; }
          .tugas-table .col-jam { width: 20%; }
          .tugas-table .col-uraian { width: 52%; }
          .tugas-table .col-keterangan { width: 20%; }
          
          /* Inventaris Table */
          .inventaris-table {
            table-layout: fixed;
            width: 100%;
          }
          .inventaris-table .col-no { width: 8%; }
          .inventaris-table .col-nama { width: 72%; }
          .inventaris-table .col-jumlah { width: 20%; }
          
          /* TTD Table */
          .ttd-table { 
            margin-top: 20px;
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }
          .ttd-table td {
            width: 33.33%;
            border: none;
            text-align: center;
            vertical-align: top;
            padding: 10px 5px;
          }
          .ttd-table .ttd-header { 
            border: none; 
            text-align: center; 
            padding: 8px;
            font-weight: bold;
            font-size: 12px;
            background: none;
          }
          .ttd-table .ttd-cell { 
            border: none; 
            text-align: center; 
            height: 120px; 
            vertical-align: top;
            padding: 10px 5px;
            background: none;
          }
          .ttd-signature {
            width: 120px;
            height: auto;
            margin-bottom: 5px;
            display: block;
            margin-left: auto;
            margin-right: auto;
          }
          .ttd-name {
            font-size: 11px;
            font-weight: bold;
            margin-top: 5px;
            text-align: center;
          }
          
          /* Watermark */
          .watermark { 
            position: fixed; 
            right: 10px; 
            bottom: 10px; 
            opacity: 0.08; 
            z-index: 1; 
            pointer-events: none;
          }
          .watermark-img { 
            max-width: 200px; 
            max-height: 200px;
            object-fit: contain;
          }
          .watermark-placeholder {
            max-width: 200px;
            max-height: 200px;
            background-color: #f0f0f0;
            display: flex;
            justify-content: center;
            align-items: center;
            color: #555;
            font-size: 12px;
            font-weight: bold;
            border: 1px dashed #ccc;
            padding: 5px;
            opacity: 0.08;
          }

          /* Page break handling */
          .laporan-page:last-child {
            page-break-after: avoid;
          }
        </style>
      </head>
      <body>
        ${html}
      </body>
      </html>
    `;

    const options = {
      format: 'A4',
      orientation: 'portrait',
      border: {
        top: '1in',
        right: '1in',
        bottom: '1in',
        left: '1in'
      },
      timeout: 60000, // 60 seconds
      type: 'pdf',
      quality: '100',
      renderDelay: 2000,
      phantomArgs: [
        '--load-images=yes', 
        '--local-to-remote-url-access=yes',
        '--web-security=no',
        '--ignore-ssl-errors=yes',
        '--ssl-protocol=any'
      ],
      // Tambahan untuk hasil yang lebih baik
      zoomFactor: '1',
      base: `file://${assetsPath}/`
    };

    // Generate PDF menggunakan html-pdf dengan Promise
    const generatePDF = () => {
      return new Promise((resolve, reject) => {
        pdf.create(fullHtml, options).toBuffer((err, buffer) => {
          if (err) {
            console.error('PDF generation error:', err);
            reject(err);
          } else {
            resolve(buffer);
          }
        });
      });
    };

    const pdfBuffer = await generatePDF();
    
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=${filename}`,
    });
    res.send(pdfBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};