import express from "express";
import authMiddleware, { requireRole } from "../../middleware/middleware";
import { checkWhatsAppStatus, sendTestMessage, whatsappLogs } from "./check.whatsapp";
import { logoutWhatsapp } from "./logout.whatsapp";
const whatsappRouter = express.Router();

whatsappRouter.get('/check-status', authMiddleware, requireRole(['TENANT_OWNER','TENANT_ADMIN', 'SAAS_SUPER_ADMIN']), checkWhatsAppStatus);
whatsappRouter.post('/message',authMiddleware, requireRole(['TENANT_OWNER','TENANT_ADMIN', 'SAAS_SUPER_ADMIN']), sendTestMessage )
whatsappRouter.get('/logs', authMiddleware, requireRole(['TENANT_OWNER','TENANT_ADMIN', 'SAAS_SUPER_ADMIN']), whatsappLogs);
whatsappRouter.post('/disconnect', authMiddleware, requireRole(['TENANT_OWNER','TENANT_ADMIN', 'SAAS_SUPER_ADMIN']), logoutWhatsapp);

export default whatsappRouter; 