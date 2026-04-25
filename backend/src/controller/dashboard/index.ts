import { Router } from "express";
import authMiddleware, { requireRole } from "../../middleware/middleware";
import { Detso_Role } from "@prisma/client";
import { getSaasDashboardData } from "./saas.dashboard";
import { getTenantDashboardData } from "./tenant.dashboard";

const dashboardRouter = Router();

// Endpoint khusus Super Admin
dashboardRouter.get(
    '/saas',
    authMiddleware,
    requireRole([Detso_Role.SAAS_SUPER_ADMIN]),
    getSaasDashboardData
);

// Endpoint untuk Tenant Owner & Admin
dashboardRouter.get(
    '/tenant',
    authMiddleware,
    requireRole([Detso_Role.TENANT_OWNER, Detso_Role.TENANT_ADMIN]),
    getTenantDashboardData
);

export default dashboardRouter;
