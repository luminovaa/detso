import express from "express";
import authMiddleware, { ADMIN_ONLY, ALL_STAFF, requireRole } from "../../middleware/middleware";
import { serviceUpload } from "../../config/upload.config";
import { createServiceConnection } from "./create.service";
import { editServiceConnection } from "./edit.service";
import { deleteServiceConnection } from "./delete.service";

const serviceRouter = express.Router();

serviceRouter.post(
  '/',
  authMiddleware,
    serviceUpload,
  requireRole(ALL_STAFF),
  createServiceConnection
);
// serviceRouter.get('/', authMiddleware, requireRole(ALL_STAFF), getAllCustomers);
// serviceRouter.get('/:id', authMiddleware, requireRole(ALL_STAFF), getCustomerById);
serviceRouter.put('/:id', authMiddleware, requireRole(ALL_STAFF), serviceUpload, editServiceConnection);
serviceRouter.delete('/:id', authMiddleware, requireRole(ADMIN_ONLY), deleteServiceConnection);
export default serviceRouter;