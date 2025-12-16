// import { Request, Response } from 'express';
// import { asyncHandler, AuthenticationError } from '../utils/error-handler';
// import { prisma } from '../utils/prisma';
// import { responseData } from '../utils/response-handler';
// import { whatsappManager } from './whatsapp-manager';

// // Get Logs
// export const getWhatsappLogs = asyncHandler(async (req: Request, res: Response) => {
//     const user = req.user;
//     if (!user || !user.tenantId) throw new AuthenticationError('Sesi invalid');

//     const { page = 1, limit = 10 } = req.query;
//     const skip = (Number(page) - 1) * Number(limit);

//     const logs = await prisma.detso_WhatsApp_Log.findMany({
//         where: { tenant_id: user.tenantId },
//         orderBy: { created_at: 'desc' },
//         take: Number(limit),
//         skip: skip,
//         include: { customer: { select: { name: true } } }
//     });

//     const total = await prisma.detso_WhatsApp_Log.count({
//         where: { tenant_id: user.tenantId }
//     });

//     responseData(res, 200, 'Logs fetched', {
//         logs,
//         pagination: {
//             currentPage: Number(page),
//             totalPages: Math.ceil(total / Number(limit)),
//             totalItems: total
//         }
//     });
// });

// // Logout
// export const logoutWhatsapp = asyncHandler(async (req: Request, res: Response) => {
//     const user = req.user;
//     if (!user || !user.tenantId) throw new AuthenticationError('Sesi invalid');

//     await whatsappManager.logout(user.tenantId);
//     responseData(res, 200, 'WhatsApp logged out successfully');
// });

// // Kirim Pesan Manual (Test)
// export const sendWhatsappMessage = asyncHandler(async (req: Request, res: Response) => {
//     const user = req.user;
//     if (!user || !user.tenantId) throw new AuthenticationError('Sesi invalid');

//     const { phone, message } = req.body;

//     try {
//         await whatsappManager.sendMessage(user.tenantId, phone, message);
        
//         // Simpan Log
//         await prisma.detso_WhatsApp_Log.create({
//             data: {
//                 tenant_id: user.tenantId,
//                 phone_number: phone,
//                 message_type: 'TEXT',
//                 status: 'sent'
//             }
//         });

//         responseData(res, 200, 'Pesan terkirim');
//     } catch (error: any) {
//         await prisma.detso_WhatsApp_Log.create({
//             data: {
//                 tenant_id: user.tenantId,
//                 phone_number: phone,
//                 message_type: 'TEXT',
//                 status: 'failed',
//                 error_message: error.message
//             }
//         });
//         throw new Error('Gagal kirim pesan: ' + error.message);
//     }
// });