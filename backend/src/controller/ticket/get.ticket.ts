import { Request, Response } from "express";
import { asyncHandler, NotFoundError, ValidationError, AuthenticationError } from "../../utils/error-handler";
import { paginationSchema } from "./validation/validation.ticket";
import { prisma } from "../../utils/prisma";
import { getPagination } from "../../utils/pagination";
import { responseData } from "../../utils/response-handler";
import { Detso_Role } from "@prisma/client";

export const getAllTickets = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // [NEW] 1. Ambil tenant_id
    const user = req.user;
    if (!user || !user.tenant_id) {
        throw new AuthenticationError('Sesi tidak valid atau Tenant ID tidak ditemukan');
    }
    const tenantId = user.tenant_id;

    const validationResult = paginationSchema.safeParse(req.query);

    if (!validationResult.success) {
        throw new ValidationError('Validasi gagal', validationResult.error.errors);
    }

    const { page, limit, search, priority, status } = validationResult.data;

    // [NEW] 2. Base Where Clause dengan tenant_id
    const whereClause: any = {
        tenant_id: tenantId, // <--- KUNCI UTAMA FILTER
        deleted_at: null
    };

    if (priority) {
        whereClause.priority = priority;
    }

    if (status) {
        whereClause.status = status;
    }

    // Role Restriction: Teknisi hanya lihat tiket yang ditugaskan ke dia
    if (user.role === Detso_Role.TENANT_TEKNISI) {
        whereClause.assigned_to = user.id;
    }

    if (search) {
        // Logika pencarian tetap sama, tapi sudah terbungkus di dalam tenant_id (implisit AND)
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
                    notes: true
                }
            }
        },
        orderBy: {
            created_at: 'desc'
        }
    });

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    
    const formattedTickets = tickets.map(ticket => ({
        id: ticket.id,
        title: ticket.title,
        description: ticket.description,
        priority: ticket.priority,
        status: ticket.status,
        created_at: ticket.created_at,
        type: ticket.type,
        updated_at: ticket.updated_at,
        resolved_at: ticket.resolved_at,
        customer: ticket.customer,
        service: ticket.service,
        technician: ticket.technician ? {
            id: ticket.technician.id,
            username: ticket.technician.username,
            email: ticket.technician.email,
            phone: ticket.technician.phone,
            profile: {
                full_name: ticket.technician.profile?.full_name || null,
                avatar: ticket.technician.profile?.avatar 
                    ? `${baseUrl}/${ticket.technician.profile.avatar}` 
                    : null
            }
        } : null,
        schedule: ticket.schedule
    }));

    responseData(res, 200, 'Daftar tiket berhasil diambil', {
        tickets: formattedTickets,
        pagination
    });
});

export const getTicketById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // [NEW] 1. Ambil tenant_id
    const user = req.user;
    if (!user || !user.tenant_id) {
        throw new AuthenticationError('Sesi tidak valid');
    }
    const tenantId = user.tenant_id;

    const ticketId = req.params.id;

    // [NEW] 2. Cari Tiket dengan Filter Tenant
    const ticket = await prisma.detso_Ticket.findFirst({
        where: { 
            id: ticketId, 
            tenant_id: tenantId, // <--- Filter Tenant
            deleted_at: null 
        },
        include: {
            service: {
                select: {
                    id: true,
                    id_pel: true,
                    package_name: true,
                    address: true,
                    mac_address: true,
                    package_speed: true,
                    customer: true
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
                                    full_name: true,
                                    avatar: true
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

    const baseUrl = process.env.BASE_URL;
    const formattedTicket = {
        id: ticket.id,
        title: ticket.title,
        description: ticket.description,
        priority: ticket.priority,
        status: ticket.status,
        created_at: ticket.created_at,
        updated_at: ticket.updated_at,
        resolved_at: ticket.resolved_at,
        
        service: ticket.service ? {
            id: ticket.service.id,
            id_pel: ticket.service.id_pel,
            package_name: ticket.service.package_name,
            address: ticket.service.address,
            mac_address: ticket.service.mac_address,
            package_speed: ticket.service.package_speed,
            customer: ticket.service.customer,
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
                full_name: ticket.schedule.technician.profile?.full_name,
                avatar: ticket.schedule.technician.profile?.avatar ? `${baseUrl}/${ticket.schedule.technician.profile.avatar}` : null
            } : null
        } : null
    };

    responseData(res, 200, 'Detail tiket berhasil diambil', {
        ticket: formattedTicket
    });
});
export const getTicketHistory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // [NEW] 1. Ambil tenant_id
    const user = req.user;
    if (!user || !user.tenant_id) {
        throw new AuthenticationError('Sesi tidak valid');
    }
    const tenantId = user.tenant_id;

    const ticketId = req.params.id;

    // [NEW] 2. Pastikan Tiket Milik Tenant Ini sebelum ambil history
    const ticketExists = await prisma.detso_Ticket.findFirst({
        where: { 
            id: ticketId, 
            tenant_id: tenantId, // <--- Filter Tenant
            deleted_at: null 
        },
        select: { id: true }
    });

    if (!ticketExists) {
        throw new NotFoundError('Tiket tidak ditemukan');
    }

    // Get ticket history (Aman karena parent ticket sudah divalidasi)
    const ticketHistories = await prisma.detso_Ticket_History.findMany({
        where: { ticket_id: ticketId },
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    profile: {
                        select: {
                            full_name: true,
                            avatar: true
                        }
                    }
                }
            }
        },
        orderBy: {
            created_at: 'asc'
        }
    });

    // Get work schedule activities
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
                            full_name: true,
                            avatar: true
                        }
                    }
                }
            }
        },
        orderBy: {
            created_at: 'desc'
        }
    });

    const baseUrl = process.env.BASE_URL;

    const formattedHistories = ticketHistories.map(history => ({
        id: history.id,
        action: history.action,
        description: history.description,
        image: history.image ? `${baseUrl}/${history.image}` : null,
        created_at: history.created_at,
        created_by: history.user ? {
            id: history.user.id,
            username: history.user.username,
            full_name: history.user.profile?.full_name,
            avatar: history.user.profile?.avatar ? `${baseUrl}/${history.user.profile.avatar}` : null
        } : null
    }));

    const formattedActivities = activities.map(activity => ({
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
            full_name: activity.technician.profile?.full_name,
            avatar: activity.technician.profile?.avatar ? `${baseUrl}/${activity.technician.profile.avatar}` : null
        } : null
    }));

    responseData(res, 200, 'History tiket berhasil diambil', {
        histories: formattedHistories,
        activities: formattedActivities
    });
});

export const getTicketImageById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // [NEW] 1. Ambil tenant_id
    const user = req.user;
    if (!user || !user.tenant_id) {
        throw new AuthenticationError('Sesi tidak valid');
    }
    const tenantId = user.tenant_id;

    const { historyId } = req.params;

    // [NEW] 2. Validasi Relasi sampai ke Ticket Parent
    const history = await prisma.detso_Ticket_History.findFirst({
        where: { 
            id: historyId 
        },
        select: {
            image: true,
            ticket: {
                select: {
                    id: true,
                    deleted_at: true,
                    tenant_id: true // <--- Select Tenant ID Tiket Induk
                }
            }
        }
    });

    // [NEW] 3. Cek apakah tiket induk milik tenant ini
    if (!history || history.ticket.deleted_at || !history.image) {
        throw new NotFoundError('Gambar tiket tidak ditemukan');
    }

    if (history.ticket.tenant_id !== tenantId) {
        throw new NotFoundError('Gambar tiket tidak ditemukan'); // Jangan kasih tau "Akses Ditolak" biar attacker bingung
    }

    const baseUrl = process.env.BASE_URL;
    const imageUrl = `${baseUrl}/${history.image}`;

    responseData(res, 200, 'Gambar tiket berhasil diambil', {
        image: imageUrl
    });
});