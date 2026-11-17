import express from "express";
import { Detso_Role } from "@prisma/client"; // [NEW] Import Enum Role
import authMiddleware, { ADMIN_ONLY, ALL_STAFF, requireRole } from "../../middleware/middleware";
import { createCustomer } from "./create.customer";
import { uploadCustomerFiles } from "../../config/upload.config";
import { checkCustomerByNik, getAllCustomers, getCustomerById } from "./get.customer";
import { deleteCustomer } from "./delete.customer";
import { editCustomer } from "./edit.customer";
import { downloadInstallationReport, viewInstallationReport, getSignedPdfUrl } from "./pdf.customer";
import { validateFileUpload, sanitizeUploadedFiles } from "../../middleware/file-validation.middleware";
import { uploadLimiter } from "../../middleware/rate-limit.middleware";

const customerRouter = express.Router();


// Create Customer: Semua staff boleh
customerRouter.post(
  '/',
  authMiddleware,
  requireRole(ALL_STAFF),
  uploadLimiter, // Rate limit untuk upload
  uploadCustomerFiles,
  sanitizeUploadedFiles, // Sanitize filenames
  validateFileUpload({ allowedTypes: 'all', maxSize: 5 * 1024 * 1024 }), // Validate files
  createCustomer
);

// Get All / Search: Semua staff boleh
customerRouter.get(
  '/', 
  authMiddleware, 
  requireRole(ALL_STAFF), 
  getAllCustomers
);

// Get Detail: Semua staff boleh
customerRouter.get(
  '/:id', 
  authMiddleware, 
  requireRole(ALL_STAFF), 
  getCustomerById
);

// Edit Customer: HANYA Owner dan Admin (Teknisi DILARANG)
customerRouter.put(
  '/:id', 
  authMiddleware,
  requireRole(ADMIN_ONLY),
  uploadLimiter, // Rate limit untuk upload
  uploadCustomerFiles,
  sanitizeUploadedFiles, // Sanitize filenames
  validateFileUpload({ allowedTypes: 'all', maxSize: 5 * 1024 * 1024 }), // Validate files
  editCustomer
);

// Delete Customer: HANYA Owner dan Admin (Teknisi DILARANG)
customerRouter.delete(
  '/:id', 
  authMiddleware, 
  requireRole(ADMIN_ONLY), 
  deleteCustomer
);

// Reports: HANYA Owner dan Admin (Teknisi DILARANG)
customerRouter.get(
  '/pdf/:customerId/download', 
  authMiddleware, 
  requireRole(ADMIN_ONLY), 
  downloadInstallationReport
);

customerRouter.get(
  '/pdf/:customerId/view', 
  authMiddleware, 
  requireRole(ADMIN_ONLY), 
  viewInstallationReport
);

// Signed URL for PDF (authenticated → returns signed URL to open in browser)
customerRouter.get(
  '/pdf/:customerId/signed-url',
  authMiddleware,
  requireRole(ADMIN_ONLY),
  getSignedPdfUrl
);

// Check NIK: Semua staff boleh cek
customerRouter.get(
  '/check-nik/:nik', 
  authMiddleware, 
  requireRole(ALL_STAFF), // Sebaiknya diproteksi role juga agar publik tidak bisa scraping NIK
  checkCustomerByNik
);

export default customerRouter;