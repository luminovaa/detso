import express from "express";
import authMiddleware, { ADMIN_ONLY, ALL_STAFF, requireRole } from "../../middleware/middleware";
import { tenantUpload } from "../../config/upload.config";
import { getAllTenants, getTenantById, getTenantLogo, } from "./get.tenant";
import { deleteTenant } from "./delete.tenant";
import { editTenant } from "./edit.tenant";

const tenantRouter = express.Router();

tenantRouter.get('/', authMiddleware, requireRole(['SAAS_SUPER_ADMIN']), getAllTenants);
tenantRouter.get('/:id', authMiddleware, requireRole(['SAAS_SUPER_ADMIN', 'TENANT_OWNER']), getTenantById);
tenantRouter.put('/:id', authMiddleware, requireRole(['SAAS_SUPER_ADMIN', 'TENANT_OWNER']), tenantUpload.single('image'), editTenant);
tenantRouter.delete('/:id', authMiddleware, requireRole(ADMIN_ONLY), deleteTenant);
tenantRouter.get(
    '/:id/logo',
    authMiddleware,
    // Semua role boleh akses (requireRole validasi login saja)
    getTenantLogo
);
export default tenantRouter;