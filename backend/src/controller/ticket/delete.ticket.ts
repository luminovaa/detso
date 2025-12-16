import { Request, Response } from 'express';
import { asyncHandler, AuthorizationError, NotFoundError, AuthenticationError } from '../../utils/error-handler';
import { responseData } from '../../utils/response-handler';
import { prisma } from '../../utils/prisma';
import { deleteFile } from '../../config/upload-file';
import { Detso_Role } from '@prisma/client';

export const deleteTicket = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // [NEW] 1. Ambil tenant_id
    const user = req.user;
    if (!user || !user.tenantId) {
        throw new AuthenticationError('Sesi tidak valid atau Tenant ID tidak ditemukan');
    }
    const tenantId = user.tenantId;

    const ticketId = req.params.id;

    // [NEW] 2. Cek Role (Hanya Owner & Admin)
    if (user.role !== Detso_Role.TENANT_OWNER && user.role !== Detso_Role.TENANT_ADMIN) {
        throw new AuthorizationError('Hanya Owner atau Admin yang dapat menghapus tiket');
    }

    // [NEW] 3. Cari Tiket dengan Filter Tenant
    // Gunakan findFirst agar bisa memasukkan tenant_id
    const ticket = await prisma.detso_Ticket.findFirst({
        where: { 
            id: ticketId, 
            tenant_id: tenantId, // <--- Filter WAJIB
            deleted_at: null 
        },
        include: {
            ticket_history: {
                select: {
                    id: true,
                    image: true
                }
            },
            schedule: {
                select: {
                    id: true
                }
            }
        }
    });

    if (!ticket) {
        throw new NotFoundError('Tiket tidak ditemukan atau akses ditolak');
    }

    // Kumpulkan file yang akan dihapus
    const filesToDelete: string[] = [];

    ticket.ticket_history.forEach(history => {
        if (history.image) {
            filesToDelete.push(history.image);
        }
    });

    // Transaction: Soft Delete Ticket & Hard Delete Children
    const result = await prisma.$transaction(async (tx) => {
        // Soft delete ticket
        // Aman pakai update by ID karena sudah divalidasi kepemilikannya di step 3
        const deletedTicket = await tx.detso_Ticket.update({
            where: { id: ticketId },
            data: { deleted_at: new Date() }
        });

        // Hard delete histories
        // Aman karena history terikat pada ticket_id yang sudah valid
        const deletedHistories = await tx.detso_Ticket_History.deleteMany({
            where: { ticket_id: ticketId }
        });

        // Hard delete schedule (jika ada)
        // Aman karena schedule ID diambil dari object ticket yang sudah divalidasi tenant-nya
        const deletedSchedule = ticket.schedule ? await tx.detso_Work_Schedule.delete({
            where: { id: ticket.schedule.id }
        }) : null;

        return {
            ticket: deletedTicket,
            historiesDeleted: deletedHistories.count,
            scheduleDeleted: !!deletedSchedule
        };
    });

    // Hapus file fisik secara async (Non-blocking)
    let successfulDeletes = 0;
    let failedDeletes = 0;

    await Promise.all(filesToDelete.map(async filePath => {
        try {
            await deleteFile(filePath);
            console.log(`Berhasil hapus file: ${filePath}`);
            successfulDeletes++;
        } catch (err) {
            console.error(`Gagal hapus file ${filePath}:`, err);
            failedDeletes++;
        }
    }));

    responseData(res, 200, 'Tiket berhasil dihapus', {
        ticketId: ticket.id,
        ticketTitle: ticket.title,
        deletedFiles: {
            total: filesToDelete.length,
            successful: successfulDeletes,
            failed: failedDeletes
        },
        details: {
            historyImages: ticket.ticket_history.filter(h => h.image).length,
            historiesDeleted: result.historiesDeleted,
            scheduleDeleted: result.scheduleDeleted
        }
    });
});