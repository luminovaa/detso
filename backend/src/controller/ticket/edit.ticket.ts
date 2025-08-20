import { Request, Response } from 'express';
import { asyncHandler, NotFoundError, ValidationError, AuthorizationError } from '../../utils/error-handler';
import { responseData } from '../../utils/response-handler';
import { prisma } from '../../utils/prisma';
import { deleteFile, getUploadedFileInfo } from '../../config/upload-file';
import { z } from 'zod';
import { completeTicketSchema } from './validation/validation.ticket';


export const completeTicket = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const ticketId = req.params.id;
    const currentUser = req.user;
    
    // Fungsi untuk cleanup uploaded file jika terjadi error
    const cleanupUploadedFile = async () => {
        if (req.file) {
            await deleteFile(req.file.path).catch(err =>
                console.error('Gagal menghapus file:', err)
            );
        }
    };

    try {
        let uploadedImage: { path: string; fileName: string; fullPath: string } | undefined;
        if (req.file) {
            uploadedImage = getUploadedFileInfo(req.file, 'storage/image/tickets');
        }

        const validationResult = completeTicketSchema.safeParse({
            ...req.body,
            image: uploadedImage?.path
        });

        if (!validationResult.success) {
            await cleanupUploadedFile();
            throw new ValidationError('Validasi gagal', validationResult.error.errors);
        }

        const { notes, resolution_notes, image } = validationResult.data;

        // Cek apakah ticket exists dan statusnya
        const existingTicket = await prisma.detso_Ticket.findUnique({
            where: { id: ticketId },
            include: {
                schedule: true,
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
                },
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
                }
            }
        });

        if (!existingTicket) {
            await cleanupUploadedFile();
            throw new NotFoundError('Ticket tidak ditemukan');
        }

        // Cek status ticket
        if (existingTicket.status === 'RESOLVED' || existingTicket.status === 'CLOSED') {
            await cleanupUploadedFile();
            throw new ValidationError('Ticket sudah diselesaikan atau ditutup');
        }

        // Cek authorization - hanya teknisi yang assigned atau admin yang bisa complete
        const isAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';
        const isAssignedTechnician = existingTicket.assigned_to === currentUser?.id;

        if (!isAdmin && !isAssignedTechnician) {
            await cleanupUploadedFile();
            throw new AuthorizationError('Anda tidak memiliki izin untuk menyelesaikan ticket ini');
        }

        // Jika ada gambar lama, hapus
        if (image && existingTicket.image) {
            await deleteFile(existingTicket.image).catch(error =>
                console.error('Gagal menghapus gambar lama:', error)
            );
        }

        const result = await prisma.$transaction(async (tx) => {
            const updatedTicket = await tx.detso_Ticket.update({
                where: { id: ticketId },
                data: {
                    status: 'RESOLVED',
                    resolved_at: new Date(),
                    image: image || existingTicket.image,
                    updated_at: new Date()
                },
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
            });

            // Update work schedule jika ada
            let updatedSchedule = null;
            if (existingTicket.schedule) {
                updatedSchedule = await tx.detso_Work_Schedule.update({
                    where: { id: existingTicket.schedule.id },
                    data: {
                        status: 'COMPLETED',
                        end_time: new Date(),
                        notes: notes || resolution_notes
                    }
                });
            }

            return { updatedTicket, updatedSchedule };
        });

        responseData(res, 200, 'Ticket berhasil diselesaikan', {
            ticket: {
                id: result.updatedTicket.id,
                title: result.updatedTicket.title,
                description: result.updatedTicket.description,
                priority: result.updatedTicket.priority,
                status: result.updatedTicket.status,
                resolved_at: result.updatedTicket.resolved_at,
                image: result.updatedTicket.image,
                customer: result.updatedTicket.customer,
                service: result.updatedTicket.service,
                technician: result.updatedTicket.technician ? {
                    id: result.updatedTicket.technician.id,
                    username: result.updatedTicket.technician.username,
                    full_name: result.updatedTicket.technician.profile?.full_name
                } : null
            },
            schedule: result.updatedSchedule
        });

    } catch (error) {
        // Cleanup file jika terjadi error
        await cleanupUploadedFile();
        throw error;
    }
});

// Fungsi untuk update ticket (edit)
export const updateTicket = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const ticketId = req.params.id;
    const currentUser = req.user;

    // Fungsi untuk cleanup uploaded file jika terjadi error
    const cleanupUploadedFile = async () => {
        if (req.file) {
            await deleteFile(req.file.path).catch(err =>
                console.error('Gagal menghapus file:', err)
            );
        }
    };

    try {
        // Handle file upload jika ada
        let uploadedImage: { path: string; fileName: string; fullPath: string } | undefined;
        if (req.file) {
            uploadedImage = getUploadedFileInfo(req.file, 'storage/image/tickets');
        }

        // Validation schema untuk update
        const updateTicketSchema = z.object({
            title: z.string().min(1, 'Judul wajib diisi').optional(),
            description: z.string().min(1, 'Deskripsi wajib diisi').optional(),
            priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
            status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
            assigned_to: z.string().optional(),
            image: z.string().optional()
        });

        const validationResult = updateTicketSchema.safeParse({
            ...req.body,
            image: uploadedImage?.path
        });

        if (!validationResult.success) {
            await cleanupUploadedFile();
            throw new ValidationError('Validasi gagal', validationResult.error.errors);
        }

        const { title, description, priority, status, assigned_to, image } = validationResult.data;

        // Cek apakah ticket exists
        const existingTicket = await prisma.detso_Ticket.findUnique({
            where: { id: ticketId },
            include: {
                schedule: true
            }
        });

        if (!existingTicket) {
            await cleanupUploadedFile();
            throw new NotFoundError('Ticket tidak ditemukan');
        }

        // Cek authorization
        const isAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';
        const isAssignedTechnician = existingTicket.assigned_to === currentUser?.id;

        if (!isAdmin && !isAssignedTechnician) {
            await cleanupUploadedFile();
            throw new AuthorizationError('Anda tidak memiliki izin untuk mengubah ticket ini');
        }

        // Validasi teknisi jika assigned_to diubah
        if (assigned_to) {
            const technician = await prisma.detso_User.findUnique({
                where: { id: assigned_to, deleted_at: null }
            });

            if (!technician) {
                await cleanupUploadedFile();
                throw new NotFoundError('Teknisi tidak ditemukan');
            }
        }

        // Jika ada gambar baru dan gambar lama, hapus gambar lama
        if (image && existingTicket.image) {
            await deleteFile(existingTicket.image).catch(error =>
                console.error('Gagal menghapus gambar lama:', error)
            );
        }

        // Update ticket dan schedule dalam transaction
        const result = await prisma.$transaction(async (tx) => {
            // Update ticket
            const updatedTicket = await tx.detso_Ticket.update({
                where: { id: ticketId },
                data: {
                    title: title || existingTicket.title,
                    description: description || existingTicket.description,
                    priority: priority || existingTicket.priority,
                    status: status || existingTicket.status,
                    assigned_to: assigned_to !== undefined ? assigned_to : existingTicket.assigned_to,
                    image: image || existingTicket.image,
                    updated_at: new Date(),
                    ...(status === 'RESOLVED' && !existingTicket.resolved_at && { resolved_at: new Date() })
                },
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
            });

            // Update atau buat schedule jika assigned_to berubah
            let updatedSchedule = null;
            if (assigned_to && assigned_to !== existingTicket.assigned_to) {
                if (existingTicket.schedule) {
                    // Update schedule yang sudah ada
                    updatedSchedule = await tx.detso_Work_Schedule.update({
                        where: { id: existingTicket.schedule.id },
                        data: {
                            technician_id: assigned_to,
                            status: status === 'RESOLVED' ? 'COMPLETED' : 'SCHEDULED',
                            ...(status === 'RESOLVED' && { end_time: new Date() })
                        }
                    });
                } else {
                    // Buat schedule baru
                    updatedSchedule = await tx.detso_Work_Schedule.create({
                        data: {
                            technician_id: assigned_to,
                            ticket_id: ticketId,
                            start_time: new Date(),
                            status: status === 'RESOLVED' ? 'COMPLETED' : 'SCHEDULED',
                            ...(status === 'RESOLVED' && { end_time: new Date() })
                        }
                    });
                }
            } else if (existingTicket.schedule && status && status !== existingTicket.status) {
                // Update status schedule jika status ticket berubah
                updatedSchedule = await tx.detso_Work_Schedule.update({
                    where: { id: existingTicket.schedule.id },
                    data: {
                        status: status === 'RESOLVED' ? 'COMPLETED' : 'SCHEDULED',
                        ...(status === 'RESOLVED' && !existingTicket.schedule.end_time && { end_time: new Date() })
                    }
                });
            }

            return { updatedTicket, updatedSchedule };
        });

        responseData(res, 200, 'Ticket berhasil diperbarui', {
            ticket: {
                id: result.updatedTicket.id,
                title: result.updatedTicket.title,
                description: result.updatedTicket.description,
                priority: result.updatedTicket.priority,
                status: result.updatedTicket.status,
                resolved_at: result.updatedTicket.resolved_at,
                image: result.updatedTicket.image,
                customer: result.updatedTicket.customer,
                service: result.updatedTicket.service,
                technician: result.updatedTicket.technician ? {
                    id: result.updatedTicket.technician.id,
                    username: result.updatedTicket.technician.username,
                    full_name: result.updatedTicket.technician.profile?.full_name
                } : null
            },
            schedule: result.updatedSchedule
        });

    } catch (error) {
        // Cleanup file jika terjadi error
        await cleanupUploadedFile();
        throw error;
    }
});