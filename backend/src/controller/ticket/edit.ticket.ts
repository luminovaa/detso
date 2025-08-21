import { Request, Response } from 'express';
import { asyncHandler, NotFoundError, ValidationError } from '../../utils/error-handler';
import { responseData } from '../../utils/response-handler';
import { updateTicketSchema } from './validation/validation.ticket';
import { prisma } from '../../utils/prisma';
import { TicketAction } from '@prisma/client';
import { deleteFile, getUploadedFileInfo } from '../../config/upload-file';

export const editTicket = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    
    const cleanupUploadedFile = async () => {
        if (req.file) {
            await deleteFile(req.file.path).catch(err =>
                console.error('Gagal menghapus file:', err)
            );
        }
    };

    let uploadedImage: { path: string; fileName: string; fullPath: string } | undefined;
    if (req.file) {
        uploadedImage = getUploadedFileInfo(req.file, 'storage/image/tickets');
    }

    const validationResult = updateTicketSchema.safeParse({
        ...req.body,
        image: uploadedImage?.path
    });

    if (!validationResult.success) {
        await cleanupUploadedFile();
        throw new ValidationError('Validasi gagal', validationResult.error.errors);
    }

    const {
        title,
        description,
        priority,
        status,
        assigned_to,
        service_id,
        resolved_at,
        image
    } = validationResult.data;

    const updated_by = req.user?.id;

    const existingTicket = await prisma.detso_Ticket.findUnique({
        where: { id, deleted_at: null },
        include: {
            technician: assigned_to ? {
                select: { id: true, username: true }
            } : undefined
        }
    });

    if (!existingTicket) {
        await cleanupUploadedFile();
        throw new NotFoundError('Ticket tidak ditemukan');
    }

    if (service_id) {
        const service = await prisma.detso_Service_Connection.findUnique({
            where: { id: service_id, deleted_at: null }
        });

        if (!service) {
            await cleanupUploadedFile();
            throw new NotFoundError('Layanan tidak ditemukan');
        }

        if (service.customer_id !== existingTicket.customer_id) {
            await cleanupUploadedFile();
            throw new ValidationError('Layanan tidak dimiliki oleh customer ini');
        }
    }

    // Validate technician if assigned
    if (assigned_to) {
        const technician = await prisma.detso_User.findUnique({
            where: { id: assigned_to, deleted_at: null }
        });

        if (!technician) {
            await cleanupUploadedFile();
            throw new NotFoundError('Teknisi tidak ditemukan');
        }
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            const historyEntries = [];
            const updateData: any = {
                updated_at: new Date()
            };

            if (title !== undefined && title !== existingTicket.title) {
                updateData.title = title;
                historyEntries.push({
                    action: 'UPDATED' as const,
                    description: `Judul diubah dari "${existingTicket.title}" menjadi "${title}"`
                });
            }

            if (description !== undefined && description !== existingTicket.description) {
                updateData.description = description;
                historyEntries.push({
                    action: 'UPDATED' as const,
                    description: `Deskripsi diubah`
                });
            }

            if (priority !== undefined && priority !== existingTicket.priority) {
                updateData.priority = priority;
                historyEntries.push({
                    action: 'PRIORITY_CHANGED' as const,
                    description: `Priority diubah dari ${existingTicket.priority} menjadi ${priority}`
                });
            }

            if (service_id !== undefined && service_id !== existingTicket.service_id) {
                updateData.service_id = service_id;
                historyEntries.push({
                    action: 'UPDATED' as const,
                    description: `Layanan diubah`
                });
            }

            if (status !== undefined && status !== existingTicket.status) {
                updateData.status = status;

                if (status === 'RESOLVED' || status === 'CLOSED') {
                    updateData.resolved_at = new Date();
                } else if (status === 'OPEN' && existingTicket.status === 'CLOSED') {
                    updateData.resolved_at = null;
                }

                let action: TicketAction = 'STATUS_CHANGED';
                let descriptionText = `Status diubah dari ${existingTicket.status} menjadi ${status}`;

                if (status === 'CLOSED' && existingTicket.status !== 'CLOSED') {
                    action = 'CLOSED';
                    descriptionText = `Ticket ditutup`;
                } else if (status === 'RESOLVED' && existingTicket.status !== 'RESOLVED') {
                    action = 'RESOLVED';
                    descriptionText = `Ticket diselesaikan`;
                } else if (status === 'OPEN' && existingTicket.status === 'CLOSED') {
                    action = 'REOPENED';
                    descriptionText = `Ticket dibuka kembali`;
                }

                // Add image to history entry if status is RESOLVED or CLOSED and image is provided
                const historyEntry: any = {
                    action,
                    description: descriptionText
                };

                if ((status === 'RESOLVED' || status === 'CLOSED') && image) {
                    historyEntry.image = image;
                }

                historyEntries.push(historyEntry);

                if (status === 'RESOLVED' || status === 'CLOSED') {
                    await tx.detso_Work_Schedule.updateMany({
                        where: { ticket_id: id },
                        data: {
                            status: 'COMPLETED',
                            end_time: new Date(),
                            updated_at: new Date()
                        }
                    });
                }
            }

            if (assigned_to !== undefined && assigned_to !== existingTicket.assigned_to) {
                updateData.assigned_to = assigned_to;

                if (assigned_to) {
                    historyEntries.push({
                        action: 'ASSIGNED' as const,
                        description: `Ticket ditugaskan kepada teknisi baru`
                    });

                    const existingSchedule = await tx.detso_Work_Schedule.findFirst({
                        where: { ticket_id: id }
                    });

                    if (existingSchedule) {
                        await tx.detso_Work_Schedule.update({
                            where: { id: existingSchedule.id },
                            data: {
                                technician_id: assigned_to,
                                updated_at: new Date()
                            }
                        });
                    } else {
                        await tx.detso_Work_Schedule.create({
                            data: {
                                technician_id: assigned_to,
                                ticket_id: id,
                                start_time: new Date(),
                                status: 'SCHEDULED'
                            }
                        });
                    }
                } else {
                    historyEntries.push({
                        action: 'UPDATED' as const,
                        description: `Penugasan teknisi dihapus`
                    });

                    await tx.detso_Work_Schedule.deleteMany({
                        where: { ticket_id: id }
                    });
                }
            }

            if (resolved_at !== undefined) {
                updateData.resolved_at = new Date(resolved_at);
            }

            const updatedTicket = await tx.detso_Ticket.update({
                where: { id },
                data: updateData,
                include: {
                    customer: {
                        select: {
                            id: true,
                            name: true,
                            phone: true
                        }
                    },
                    service: {
                        select: {
                            id: true,
                            id_pel: true,
                            package_name: true
                        }
                    },
                    technician: assigned_to !== undefined ? {
                        select: {
                            id: true,
                            username: true,
                            profile: {
                                select: {
                                    full_name: true
                                }
                            }
                        }
                    } : undefined,
                    schedule: {
                        include: {
                            technician: {
                                select: {
                                    id: true,
                                    username: true,
                                    profile: {
                                        select: {
                                            full_name: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            const createdHistories = await Promise.all(
                historyEntries.map(entry =>
                    tx.detso_Ticket_History.create({
                        data: {
                            ticket_id: id,
                            action: entry.action,
                            description: entry.description,
                            image: entry.image || null,
                            created_by: updated_by || null,
                            created_at: new Date()
                        }
                    })
                )
            );

            return { ticket: updatedTicket, histories: createdHistories };
        });

        responseData(res, 200, 'Ticket berhasil diperbarui', {
            ticket: result.ticket,
            history: result.histories
        });

    } catch (error) {
        await cleanupUploadedFile();
        throw error;
    }
});

export const updateTicketStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status } = req.body;
    const updated_by = req.user?.id;

    const cleanupUploadedFile = async () => {
        if (req.file) {
            await deleteFile(req.file.path).catch(err =>
                console.error('Gagal menghapus file:', err)
            );
        }
    };

    let uploadedImage: { path: string; fileName: string; fullPath: string } | undefined;
    if (req.file) {
        uploadedImage = getUploadedFileInfo(req.file, 'storage/image/tickets');
    }

    if (!status || !['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(status)) {
        await cleanupUploadedFile();
        throw new ValidationError('Status tidak valid');
    }

    const existingTicket = await prisma.detso_Ticket.findUnique({
        where: { id, deleted_at: null }
    });

    if (!existingTicket) {
        await cleanupUploadedFile();
        throw new NotFoundError('Ticket tidak ditemukan');
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            const updateData: any = {
                status,
                updated_at: new Date()
            };

            let action: TicketAction = 'STATUS_CHANGED';
            let description = `Status diubah dari ${existingTicket.status} menjadi ${status}`;

            if (status === 'RESOLVED' || status === 'CLOSED') {
                updateData.resolved_at = new Date();
            }

            if (status === 'CLOSED' && existingTicket.status !== 'CLOSED') {
                action = 'CLOSED';
                description = 'Ticket ditutup';
            } else if (status === 'RESOLVED' && existingTicket.status !== 'RESOLVED') {
                action = 'RESOLVED';
                description = 'Ticket diselesaikan';
            } else if (status === 'OPEN' && existingTicket.status === 'CLOSED') {
                action = 'REOPENED';
                description = 'Ticket dibuka kembali';
                updateData.resolved_at = null;
            }

            const updatedTicket = await tx.detso_Ticket.update({
                where: { id },
                data: updateData,
                include: {
                    customer: {
                        select: { name: true, phone: true }
                    },
                    technician: {
                        select: { username: true }
                    }
                }
            });

            if (status === 'RESOLVED' || status === 'CLOSED') {
                await tx.detso_Work_Schedule.updateMany({
                    where: { ticket_id: id },
                    data: {
                        status: 'COMPLETED',
                        end_time: new Date(),
                        updated_at: new Date()
                    }
                });
            }

            const historyData: any = {
                ticket_id: id,
                action,
                description,
                created_by: updated_by || null,
                created_at: new Date()
            };

            if ((status === 'RESOLVED' || status === 'CLOSED') && uploadedImage) {
                historyData.image = uploadedImage.path;
            }

            const history = await tx.detso_Ticket_History.create({
                data: historyData
            });

            return { ticket: updatedTicket, history };
        });

        responseData(res, 200, `Status ticket berhasil diubah menjadi ${status}`, result);

    } catch (error) {
        await cleanupUploadedFile();
        throw error;
    }
});

// Function khusus untuk menambahkan catatan dengan gambar
export const addTicketNote = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { notes } = req.body;
    const created_by = req.user?.id;

    const cleanupUploadedFile = async () => {
        if (req.file) {
            await deleteFile(req.file.path).catch(err =>
                console.error('Gagal menghapus file:', err)
            );
        }
    };

    // Handle uploaded image
    let uploadedImage: { path: string; fileName: string; fullPath: string } | undefined;
    if (req.file) {
        uploadedImage = getUploadedFileInfo(req.file, 'storage/image/tickets');
    }

    if (!notes && !uploadedImage) {
        await cleanupUploadedFile();
        throw new ValidationError('Catatan atau gambar harus disertakan');
    }

    const existingTicket = await prisma.detso_Ticket.findUnique({
        where: { id, deleted_at: null }
    });

    if (!existingTicket) {
        await cleanupUploadedFile();
        throw new NotFoundError('Ticket tidak ditemukan');
    }

    try {
        const history = await prisma.detso_Ticket_History.create({
            data: {
                ticket_id: id,
                action: 'NOTE_ADDED',
                description: notes || 'Gambar ditambahkan',
                image: uploadedImage?.path || null,
                created_by: created_by || null,
                created_at: new Date()
            }
        });

        responseData(res, 201, 'Catatan berhasil ditambahkan', { history });

    } catch (error) {
        // If operation fails, cleanup uploaded file
        await cleanupUploadedFile();
        throw error;
    }
});