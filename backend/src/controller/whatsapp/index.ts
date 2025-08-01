import express from "express";
import authMiddleware, { requireRole } from "../../middleware/middleware";
import { checkWhatsAppStatus, sendTestMessage } from "./check.whatsapp";
const whatsappRouter = express.Router();

whatsappRouter.get('/check-status', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), checkWhatsAppStatus);
whatsappRouter.get('/test-message',authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), sendTestMessage )


export default whatsappRouter;