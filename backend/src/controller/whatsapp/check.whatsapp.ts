import { Router, Request, Response } from 'express';
import { asyncHandler, ValidationError } from '../../utils/error-handler';
import { whatsappService } from '../../services/whatsapp.service';
import { responseData } from '../../utils/response-handler';
import { paginationSchema } from './validation/validation.whatsapp';
import { prisma } from '../../utils/prisma';
import { getPagination } from '../../utils/pagination';

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
    const { phone_number, message } = req.body;
    
    if (!phone_number || !message) {
        return responseData(res, 400, 'Phone number and message are required'); 
    }
    
    const success = await whatsappService.sendMessage(phone_number, message);
    if(success){
        await prisma.detso_WhatsApp_Log.create({
            data: {
                phone_number,
                message_type: 'Private Chat',
                status: 'sent',
                created_at: new Date()
            }
        });
    }
    responseData(res, 200, 'Message sent successfully', {
        success,
        phone_number,
        message
    });
});

export const whatsappLogs = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const validationResult = paginationSchema.safeParse(req.query)
    
      if (!validationResult.success) {
      throw new ValidationError('Validasi gagal', validationResult.error.errors);
      }
    
      const { page, limit } = validationResult.data
    
      const totalLogs = await prisma.detso_WhatsApp_Log.count();
    
      const { skip, pagination } = getPagination({
        page,
        limit,
        totalItems: totalLogs
      })
    
      const logs = await prisma.detso_WhatsApp_Log.findMany({
        include: {
            customer:true,
        },
        skip,
        take: limit,
      })
    
      responseData(res, 200, 'Daftar Paket berhasil diambil', {
        logs,
        pagination
      })
});

