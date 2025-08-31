import { Request, Response } from 'express';
import { asyncHandler, NotFoundError, ValidationError } from '../../utils/error-handler';
import { responseData } from '../../utils/response-handler';
import { createTicketSchema } from './validation/validation.ticket';
import { prisma } from '../../utils/prisma';

export const createTicket = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const validationResult = createTicketSchema.safeParse(req.body);

    if (!validationResult.success) {
        throw new ValidationError('Validasi gagal', validationResult.error.errors);
    }

    const created_by = req.user?.id;
    const { service_id, title, description, priority, assigned_to } = validationResult.data;

    let customer_id: string;

    // Jika service_id diberikan, ambil customer_id-nya
    if (service_id) {
        const service = await prisma.detso_Service_Connection.findUnique({
            where: { id: service_id, deleted_at: null },
            select: { id: true, customer_id: true, customer: true }
        });

        if (!service) {
            throw new NotFoundError('Layanan tidak ditemukan');
        }

        customer_id = service.customer_id;
    } else {
        throw new ValidationError('Layanan (service_id) harus diisi untuk menentukan customer');
    }

    if (assigned_to) {
        const technician = await prisma.detso_User.findUnique({
            where: { id: assigned_to, deleted_at: null }
        });

        if (!technician) {
            throw new NotFoundError('Teknisi tidak ditemukan');
        }
    }

    // Buat ticket dalam transaksi
    const result = await prisma.$transaction(async (tx) => {
        const ticket = await tx.detso_Ticket.create({
            data: {
                customer_id,
                service_id: service_id || null,
                title,
                description: description || '',
                priority,
                assigned_to: assigned_to || null,
                status: 'OPEN',
                created_at: new Date(),
                updated_at: new Date(),
            },
            include: {
                customer: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                    }
                },
                service: {
                    select: {
                        id: true,
                        id_pel: true,
                        package_name: true,
                    }
                },
                technician: assigned_to ? {
                    select: {
                        id: true,
                        username: true,
                        profile: {
                            select: {
                                full_name: true,
                            }
                        }
                    }
                } : undefined
            }
        });

        const ticketHistory = await tx.detso_Ticket_History.create({
            data: {
                ticket_id: ticket.id,
                action: 'CREATED',
                description: `Ticket dibuat dengan status: OPEN, priority: ${priority}`,
                created_by: created_by || null,
                created_at: new Date(),
            }
        });

        let schedule = null;
        if (assigned_to) {
            schedule = await tx.detso_Work_Schedule.create({
                data: {
                    technician_id: assigned_to,
                    ticket_id: ticket.id,
                    start_time: new Date(),
                    status: 'SCHEDULED',
                }
            });

            await tx.detso_Ticket_History.create({
                data: {
                    ticket_id: ticket.id,
                    action: 'ASSIGNED',
                    description: `Ticket ditugaskan kepada teknisi: ${assigned_to}`,
                    created_by: created_by || null,
                    created_at: new Date(),
                }
            });
        }

        return { ticket, ticketHistory, schedule };
    });

    responseData(res, 201, 'Ticket berhasil dibuat', {
        ticket: {
            ...result.ticket,
            technician: result.ticket.technician ? {
                id: result.ticket.technician.id,
                username: result.ticket.technician.username,
            } : null
        },
        schedule: result.schedule,
        history: result.ticketHistory
    });
});

