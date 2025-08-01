// routes/whatsapp.routes.ts
import { Router, Request, Response } from 'express';
import { prisma } from '../../utils/prisma';
import { asyncHandler } from '../../utils/error-handler';
import { whatsappService } from '../../services/whatsapp.service';
import { responseData } from '../../utils/response-handler';

const router = Router();

export const checkWhatsAppStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const isReady = await whatsappService.isClientReady();
    
    responseData(res, 200, 'WhatsApp status retrieved', {
        isReady,
        status: isReady ? 'connected' : 'disconnected'
    });
});

// Send test message
export const sendTestMessage = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { phoneNumber, message } = req.body;
    
    if (!phoneNumber || !message) {
        return responseData(res, 400, 'Phone number and message are required');
    }
    
    const success = await whatsappService.sendMessage(phoneNumber, message);
    
    responseData(res, success ? 200 : 500, success ? 'Message sent successfully' : 'Failed to send message', {
        success,
        phoneNumber,
        message
    });
});


export default router;