import express from "express";
import { Detso_Role } from "@prisma/client"; // [NEW] Import Enum Role
import authMiddleware, { ADMIN_ONLY, ALL_STAFF, requireRole } from "../../middleware/middleware";
import { createCustomer } from "./create.customer";
import { uploadCustomerFiles } from "../../config/upload.config";
import { checkCustomerByNik, getAllServices, getCustomerById } from "./get.customer";
import { deleteCustomer } from "./delete.customer";
import { editCustomer } from "./edit.customer";
import { downloadInstallationReport, viewInstallationReport } from "./pdf.customer";

const customerRouter = express.Router();


// Create Customer: Semua staff boleh
customerRouter.post(
  '/',
  authMiddleware,
  uploadCustomerFiles,
  requireRole(ALL_STAFF), 
  createCustomer
);

// Get All / Search: Semua staff boleh
customerRouter.get(
  '/', 
  authMiddleware, 
  requireRole(ALL_STAFF), 
  getAllServices
);

// Get Detail: Semua staff boleh
customerRouter.get(
  '/:id', 
  authMiddleware, 
  requireRole(ALL_STAFF), 
  getCustomerById
);

// Edit Customer: Semua staff boleh (Teknisi mungkin perlu update foto/dokumen)
customerRouter.put(
  '/:id', 
  authMiddleware, 
  requireRole(ALL_STAFF), 
  uploadCustomerFiles, 
  editCustomer
);

// Delete Customer: HANYA Owner dan Admin (Teknisi DILARANG)
customerRouter.delete(
  '/:id', 
  authMiddleware, 
  requireRole(ADMIN_ONLY), 
  deleteCustomer
);

// Reports: Semua staff boleh lihat/download
customerRouter.get(
  '/pdf/:id/download', 
  authMiddleware, 
  requireRole(ALL_STAFF), 
  downloadInstallationReport
);

customerRouter.get(
  '/pdf/:id/view', 
  authMiddleware, 
  requireRole(ALL_STAFF), 
  viewInstallationReport
);

// Check NIK: Semua staff boleh cek
customerRouter.get(
  '/check-nik/:nik', 
  authMiddleware, 
  requireRole(ALL_STAFF), // Sebaiknya diproteksi role juga agar publik tidak bisa scraping NIK
  checkCustomerByNik
);

export default customerRouter;