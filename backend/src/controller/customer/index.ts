import express from "express";
import authMiddleware, { requireRole } from "../../middleware/middleware";
import { createCustomer } from "./create.customer";
import { uploadCustomerFiles } from "../../config/upload.config";
import { checkCustomerByNik, getAllServices, getCustomerById } from "./get.customer";
import { deleteCustomer } from "./delete.customer";
import { editCustomer } from "./edit.customer";
import { downloadInstallationReport, viewInstallationReport } from "./pdf.customer";

const customerRouter = express.Router();

customerRouter.post(
  '/',
  authMiddleware,
  uploadCustomerFiles,
  requireRole(['ADMIN', 'SUPER_ADMIN', 'TEKNISI']),
  createCustomer
);
customerRouter.get('/', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN', 'TEKNISI']), getAllServices);
customerRouter.get('/:id', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN', 'TEKNISI']), getCustomerById);
customerRouter.put('/:id', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN', 'TEKNISI']), uploadCustomerFiles, editCustomer);
customerRouter.delete('/:id', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), deleteCustomer);
customerRouter.get('/pdf/:id/download', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN', 'TEKNISI']), downloadInstallationReport);
customerRouter.get('/pdf/:id/view', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN', 'TEKNISI']), viewInstallationReport);
customerRouter.get('/check-nik/:nik', authMiddleware, checkCustomerByNik)

export default customerRouter;