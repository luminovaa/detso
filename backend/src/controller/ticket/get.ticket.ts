import { Request, Response } from 'express';
import { asyncHandler, NotFoundError, ValidationError } from '../../utils/error-handler';
import { responseData } from '../../utils/response-handler';
import { getPagination } from '../../utils/pagination';
import { prisma } from '../../utils/prisma';
import { paginationSchema } from './validation/validation.ticket';

export const getAllTickets = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const validationResult = paginationSchema.safeParse(req.query);

    if (!validationResult.success) {
        throw new ValidationError('Validasi gagal', validationResult.error.errors);
    }

    const { page, limit, search } = validationResult.data;

    const whereClause: any = {};

    if (search) {
        whereClause.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            {
                customer: {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { phone: { contains: search } },
                        { email: { contains: search, mode: 'insensitive' } }
                    ]
                }
            },
            {
                service: {
                    OR: [
                        { id_pel: { contains: search, mode: 'insensitive' } },
                        { mac_address: { contains: search } }
                    ]
                }
            },
            {
                technician: {
                    OR: [
                        { username: { contains: search, mode: 'insensitive' } },
                        { email: { contains: search, mode: 'insensitive' } }
                    ]
                }
            }
        ];
    }

    const totalTickets = await prisma.detso_Ticket.count({
        where: whereClause
    });

    const { skip, pagination } = getPagination({
        page,
        limit,
        totalItems: totalTickets
    });

    const tickets = await prisma.detso_Ticket.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
            customer: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    email: true
                }
            },
            service: {
                select: {
                    id: true,
                    id_pel: true,
                    package_name: true,
                    address: true
                }
            },
            technician: {
                select: {
                    id: true,
                    username: true,
                    email: true,
                    phone: true,
                    profile: {
                        select: {
                            full_name: true
                        }
                    }
                }
            },
            schedule: {
                select: {
                    id: true,
                    start_time: true,
                    end_time: true,
                    status: true,
                    notes: true
                }
            }
        },
        orderBy: {
            created_at: 'desc'
        }
    });

    const formattedTickets = tickets.map(ticket => ({
        id: ticket.id,
        title: ticket.title,
        description: ticket.description,
        priority: ticket.priority,
        status: ticket.status,
        created_at: ticket.created_at,
        updated_at: ticket.updated_at,
        resolved_at: ticket.resolved_at,
        customer: ticket.customer,
        service: ticket.service,
        technician: ticket.technician ? {
            id: ticket.technician.id,
            username: ticket.technician.username,
            email: ticket.technician.email,
            phone: ticket.technician.phone,
            full_name: ticket.technician.profile?.full_name
        } : null,
        schedule: ticket.schedule
    }));

    responseData(res, 200, 'Daftar tiket berhasil diambil', {
        tickets: formattedTickets,
        pagination
    });
});