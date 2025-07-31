import express from "express";
import authMiddleware, { requireRole } from "../../middleware/middleware";
import { createCustomer } from "./create.customer";
import { uploadCustomerFiles } from "../../config/upload.config";
import { getAllCustomers, getCustomerById } from "./get.customer";
import { deleteCustomer } from "./delete.customer";
import { editCustomer } from "./edit.customer";

const customerRouter = express.Router();

customerRouter.post(
  '/',
  authMiddleware,
    uploadCustomerFiles,
  requireRole(['ADMIN', 'SUPER_ADMIN', 'TEKNISI']),
  createCustomer
);
customerRouter.get('/', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN', 'TEKNISI']), getAllCustomers);
customerRouter.get('/:id', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN', 'TEKNISI']), getCustomerById);
customerRouter.put('/:id', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN', 'TEKNISI']), uploadCustomerFiles, editCustomer);
customerRouter.delete('/:id', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), deleteCustomer);
export default customerRouter;