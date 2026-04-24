import { Router } from "express";
import authMiddleware, { requireRole } from "../../middleware/middleware";
import { Detso_Role } from "@prisma/client";
import { getSaasDashboardData } from "./saas.dashboard";

const dashboardRouter = Router();

// Endpoint khusus Super Admin
dashboardRouter.get(
    '/saas',
    authMiddleware,
    requireRole([Detso_Role.SAAS_SUPER_ADMIN]),
    getSaasDashboardData
);

export default dashboardRouter;
