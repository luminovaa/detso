import express from "express";
import authMiddleware, { ADMIN_ONLY, ALL_STAFF, requireRole } from "../../middleware/middleware";
import { serviceUpload } from "../../config/upload.config";
import { createServiceConnection } from "./create.service";
import { getAllServices, getServiceById } from "./get.service";
import { editServiceConnection } from "./edit.service";
import { deleteServiceConnection } from "./delete.service";

const serviceRouter = express.Router();

serviceRouter.get('/', authMiddleware, requireRole(ALL_STAFF), getAllServices);
serviceRouter.get('/:id', authMiddleware, requireRole(ALL_STAFF), getServiceById);
serviceRouter.post(
  '/',
  authMiddleware,
  requireRole(ADMIN_ONLY),
  serviceUpload,
  createServiceConnection
);
serviceRouter.put('/:id', authMiddleware, requireRole(ADMIN_ONLY), serviceUpload, editServiceConnection);
serviceRouter.delete('/:id', authMiddleware, requireRole(ADMIN_ONLY), deleteServiceConnection);
export default serviceRouter;