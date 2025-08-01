import express from "express";
import authMiddleware, { requireRole } from "../../middleware/middleware";
import { serviceUpload } from "../../config/upload.config";
import { createServiceConnection } from "./create.service";
import { editServiceConnection } from "./edit.service";
import { deleteServiceConnection } from "./delete.service";

const serviceRouter = express.Router();

serviceRouter.post(
  '/',
  authMiddleware,
    serviceUpload,
  requireRole(['ADMIN', 'SUPER_ADMIN', 'TEKNISI']),
  createServiceConnection
);
// serviceRouter.get('/', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN', 'TEKNISI']), getAllCustomers);
// serviceRouter.get('/:id', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN', 'TEKNISI']), getCustomerById);
serviceRouter.put('/:id', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN', 'TEKNISI']), serviceUpload, editServiceConnection);
serviceRouter.delete('/:id', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), deleteServiceConnection);
export default serviceRouter;