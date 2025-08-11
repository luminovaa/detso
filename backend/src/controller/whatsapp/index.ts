import express from "express";
import authMiddleware, { requireRole } from "../../middleware/middleware";
import { checkWhatsAppStatus, sendTestMessage, whatsappLogs } from "./check.whatsapp";
const whatsappRouter = express.Router();

whatsappRouter.get('/check-status', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), checkWhatsAppStatus);
whatsappRouter.post('/message',authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), sendTestMessage )
whatsappRouter.get('/logs', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), whatsappLogs);

export default whatsappRouter;