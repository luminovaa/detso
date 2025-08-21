import { Request, Response } from 'express';
import { asyncHandler, AuthorizationError, NotFoundError, ValidationError } from '../../utils/error-handler';
import { responseData } from '../../utils/response-handler';
import { prisma } from '../../utils/prisma';
import { deleteFile } from '../../config/upload-file';

export const deleteTicket = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const ticketId = req.params.id;

    const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN';
    if (!isAdmin) {
        throw new AuthorizationError('Hanya admin yang dapat menghapus tiket');
    }

    const ticket = await prisma.detso_Ticket.findUnique({
        where: { id: ticketId, deleted_at: null },
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
        throw new NotFoundError('Tiket tidak ditemukan');
    }

    const filesToDelete: string[] = [];

    ticket.ticket_history.forEach(history => {
        if (history.image) {
            filesToDelete.push(history.image);
        }
    });

    console.log('Ticket history images:', ticket.ticket_history.filter(h => h.image));
    console.log('Files to delete:', filesToDelete);

    const result = await prisma.$transaction(async (tx) => {
        const deletedTicket = await tx.detso_Ticket.update({
            where: { id: ticketId },
            data: { deleted_at: new Date() }
        });

        const deletedHistories = await tx.detso_Ticket_History.deleteMany({
            where: { ticket_id: ticketId }
        });

        const deletedSchedule = ticket.schedule ? await tx.detso_Work_Schedule.delete({
            where: { id: ticket.schedule.id }
        }) : null;

        return {
            ticket: deletedTicket,
            historiesDeleted: deletedHistories.count,
            scheduleDeleted: !!deletedSchedule
        };
    });

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