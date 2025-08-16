import { Request, Response } from 'express';
import { asyncHandler, NotFoundError, ValidationError } from '../../utils/error-handler';
import { responseData } from '../../utils/response-handler';
import { createTicketSchema } from './validation/validation.ticket';
import { prisma } from '../../utils/prisma';
import { TicketPriority, TicketStatus } from '@prisma/client';

export const createTicket = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const validationResult = createTicketSchema.safeParse(req.body);

    if (!validationResult.success) {
        throw new ValidationError('Validasi gagal', validationResult.error.errors);
    }

    const {
        customer_id,
        service_id,
        title,
        description,
        priority = 'MEDIUM',
        assigned_to
    } = validationResult.data ;

    const customer = await prisma.detso_Customer.findUnique({
        where: { id: customer_id, deleted_at: null }
    });

    if (!customer) {
        throw new NotFoundError('Customer tidak ditemukan');
    }

    if (service_id) {
        const service = await prisma.detso_Service_Connection.findUnique({
            where: { id: service_id, deleted_at: null }
        });

        if (!service) {
            throw new NotFoundError('Layanan tidak ditemukan');
        }

        if (service.customer_id !== customer_id) {
            throw new ValidationError('Layanan tidak dimiliki oleh customer ini');
        }
    }

    if (assigned_to) {
        const technician = await prisma.detso_User.findUnique({
            where: { id: assigned_to, deleted_at: null }
        });

        if (!technician) {
            throw new NotFoundError('Teknisi tidak ditemukan');
        }
    }

    const ticket = await prisma.detso_Ticket.create({
        data: {
            customer_id,
            service_id,
            title,
            description,
            priority,
            assigned_to,
            status: 'OPEN',
            created_at: new Date()
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
            technician: assigned_to ? {
                select: {
                    id: true,
                    username: true,
                    profile: {
                        select: {
                            full_name: true
                        }
                    }
                }
            } : undefined
        }
    });

    let schedule = null;
    if (assigned_to) {
        schedule = await prisma.detso_Work_Schedule.create({
            data: {
                technician_id: assigned_to,
                ticket_id: ticket.id,
                start_time: new Date(),
                status: 'SCHEDULED'
            }
        });
    }

    responseData(res, 201, 'Ticket berhasil dibuat', {
        ticket: {
            ...ticket,
            technician: ticket.technician ? {
                id: ticket.technician.id,
                username: ticket.technician.username,
            } : null
        },
        schedule
    });
});