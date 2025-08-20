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

export const getTicketById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const ticketId = req.params.id;

    const ticket = await prisma.detso_Ticket.findUnique({
        where: { id: ticketId },
        include: {
            customer: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    email: true,
                    address: true
                }
            },
            service: {
                select: {
                    id: true,
                    id_pel: true,
                    package_name: true,
                    address: true,
                    mac_address: true,
                    package_speed: true
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
                            full_name: true,
                            avatar: true
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
                    notes: true,
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

    if (!ticket) {
        throw new NotFoundError('Tiket tidak ditemukan');
    }

    const formattedTicket = {
        id: ticket.id,
        title: ticket.title,
        description: ticket.description,
        priority: ticket.priority,
        status: ticket.status,
        image: ticket.image,
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
            full_name: ticket.technician.profile?.full_name,
            avatar: ticket.technician.profile?.avatar
        } : null,
        schedule: ticket.schedule ? {
            id: ticket.schedule.id,
            start_time: ticket.schedule.start_time,
            end_time: ticket.schedule.end_time,
            status: ticket.schedule.status,
            notes: ticket.schedule.notes,
            technician: ticket.schedule.technician ? {
                id: ticket.schedule.technician.id,
                username: ticket.schedule.technician.username,
                full_name: ticket.schedule.technician.profile?.full_name
            } : null
        } : null
    };

    responseData(res, 200, 'Detail tiket berhasil diambil', {
        ticket: formattedTicket
    });
});

export const getTicketHistory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const ticketId = req.params.id;

    // Cek apakah tiket ada
    const ticketExists = await prisma.detso_Ticket.findUnique({
        where: { id: ticketId },
        select: { id: true }
    });

    if (!ticketExists) {
        throw new NotFoundError('Tiket tidak ditemukan');
    }

    const statusHistory = await prisma.detso_Ticket.findMany({
        where: { id: ticketId },
        select: {
            status: true,
            created_at: true,
            updated_at: true,
            resolved_at: true
        }
    });

    const activities = await prisma.detso_Work_Schedule.findMany({
        where: { ticket_id: ticketId },
        select: {
            id: true,
            start_time: true,
            end_time: true,
            status: true,
            notes: true,
            created_at: true,
            updated_at: true,
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
        },
        orderBy: {
            created_at: 'desc'
        }
    });

    responseData(res, 200, 'History tiket berhasil diambil', {
        status_history: statusHistory,
        activities: activities.map(activity => ({
            id: activity.id,
            type: 'SCHEDULE_UPDATE',
            start_time: activity.start_time,
            end_time: activity.end_time,
            status: activity.status,
            notes: activity.notes,
            created_at: activity.created_at,
            updated_at: activity.updated_at,
            technician: activity.technician ? {
                id: activity.technician.id,
                username: activity.technician.username,
                full_name: activity.technician.profile?.full_name
            } : null
        }))
    });
});