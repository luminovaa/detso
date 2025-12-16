import { Request, Response } from 'express';
import { asyncHandler, AuthenticationError, ValidationError, NotFoundError } from '../../utils/error-handler';
// [UBAH] Import Manager baru (Baileys)
import { responseData } from '../../utils/response-handler';
import { paginationSchema } from './validation/validation.whatsapp';
import { prisma } from '../../utils/prisma';
import { getPagination } from '../../utils/pagination';
import { whatsappManager } from '../../services/whatsapp-manager';
// 1. Cek Status WhatsApp
export const checkWhatsAppStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // Ambil Tenant ID
    const user = req.user;
    if (!user || !user.tenantId) throw new AuthenticationError('Sesi tidak valid');

    // Ambil status spesifik tenant ini dari Manager
    const sessionData = whatsappManager.getStatus(user.tenantId);
    
    // sessionData format: { status: 'READY' | 'CONNECTING'..., qr: string | null }
    const isReady = sessionData.status === 'READY';

    responseData(res, 200, 'WhatsApp status retrieved', {
        isReady,
        status: sessionData.status,
        qr: sessionData.qr // Opsional: kirim QR snapshot terakhir jika ada
    });
});

// 2. Kirim Pesan Test (Manual)
export const sendTestMessage = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.user;
    if (!user || !user.tenantId) throw new AuthenticationError('Sesi tidak valid');

    const { phone_number, message } = req.body;
    
    if (!phone_number || !message) {
        throw new ValidationError('Nomor telepon dan pesan wajib diisi', []); 
    }
    
    try {
        // [UBAH] Panggil manager dengan tenant_id
        await whatsappManager.sendMessage(user.tenantId, phone_number, message);
        
        // Simpan Log Sukses (Dengan Tenant ID)
        await prisma.detso_WhatsApp_Log.create({
            data: {
                tenant_id: user.tenantId, // <--- WAJIB
                phone_number,
                message_type: 'Private Chat', // Atau 'TEXT'
                status: 'sent',
                created_at: new Date()
            }
        });

        responseData(res, 200, 'Pesan berhasil dikirim', {
            success: true,
            phone_number,
            message
        });

    } catch (error: any) {
        // Simpan Log Gagal (Dengan Tenant ID)
        await prisma.detso_WhatsApp_Log.create({
            data: {
                tenant_id: user.tenantId, // <--- WAJIB
                phone_number,
                message_type: 'Private Chat',
                status: 'failed',
                error_message: error.message || 'Unknown error',
                created_at: new Date()
            }
        });

        // Lempar error agar frontend tau
        throw new Error(`Gagal kirim pesan: ${error.message}`);
    }
});

// 3. Ambil Log History (Filter per Tenant)
export const whatsappLogs = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.user;
    if (!user || !user.tenantId) throw new AuthenticationError('Sesi tidak valid');

    const validationResult = paginationSchema.safeParse(req.query);
    
    if (!validationResult.success) {
        throw new ValidationError('Validasi gagal', validationResult.error.errors);
    }
    
    const { page, limit } = validationResult.data;
    
    // Filter Dasar: Hanya log milik tenant ini
    const whereClause = {
        tenant_id: user.tenantId
    };

    const totalLogs = await prisma.detso_WhatsApp_Log.count({
        where: whereClause
    });
    
    const { skip, pagination } = getPagination({
        page,
        limit,
        totalItems: totalLogs
    });
    
    const logs = await prisma.detso_WhatsApp_Log.findMany({
        where: whereClause,
        include: {
            customer: {
                select: { name: true, phone: true } // Select field secukupnya
            },
        },
        skip,
        take: limit,
        orderBy: {
            created_at: 'desc' // Log terbaru di atas
        }
    });
    
    responseData(res, 200, 'Riwayat WhatsApp berhasil diambil', {
        logs,
        pagination
    });
});

// 4. Logout WhatsApp
