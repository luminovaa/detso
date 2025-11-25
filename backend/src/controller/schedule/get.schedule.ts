import { Request, Response } from "express";
import { Detso_Role } from "@prisma/client"; // [NEW] Import Enum Role
import { asyncHandler, AuthenticationError, NotFoundError, ValidationError } from "../../utils/error-handler";
import { scheduleFilterSchema } from "./validation/validation.schedule";
import { prisma } from "../../utils/prisma";
import { formatWIB } from "../../utils/time-fromat";
import { responseData } from "../../utils/response-handler";

export const getAllSchedules = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // [NEW] 1. Ambil tenant_id
    const user = req.user;
    if (!user || !user.tenant_id) {
        throw new AuthenticationError('Sesi tidak valid atau Tenant ID tidak ditemukan');
    }
    const tenantId = user.tenant_id;

    const queryParams = {
        ...req.query,
        ...req.params
    };

    const validationResult = scheduleFilterSchema.safeParse(queryParams);

    if (!validationResult.success) {
        throw new ValidationError('Validasi gagal', validationResult.error.errors);
    }

    const { month, year, technician_id, status } = validationResult.data;

    const currentDate = new Date();
    const targetMonth = month || currentDate.getMonth() + 1;
    const targetYear = year || currentDate.getFullYear();

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    // [NEW] 2. Base Where Clause dengan tenant_id
    const whereClause: any = {
        tenant_id: tenantId, // <--- KUNCI UTAMA SAAS
        start_time: {
            gte: startDate,
            lte: endDate
        }
    };

    // Filter Query Params
    if (technician_id) {
        whereClause.technician_id = technician_id;
    }

    if (status) {
        whereClause.status = status;
    }

    // [NEW] 3. Role Restriction (Teknisi hanya bisa lihat jadwalnya sendiri)
    if (user.role === Detso_Role.TENANT_TEKNISI) {
        // Paksa filter technician_id ke ID user yang login
        // Walaupun di query param dia minta teknisi lain, akan tertimpa di sini
        whereClause.technician_id = user.id;
    }

    // Ambil data schedules
    const schedules = await prisma.detso_Work_Schedule.findMany({
        where: whereClause,
        include: {
            technician: {
                select: {
                    id: true,
                    username: true,
                    profile: {
                        select: {
                            full_name: true,
                        }
                    }
                }
            },
            ticket: {
                select: {
                    id: true,
                    title: true,
                    description: true,
                    priority: true,
                    status: true,
                    customer: {
                        select: {
                            id: true,
                            name: true,
                            phone: true,
                            address: true
                        }
                    }
                }
            }
        },
        orderBy: {
            start_time: 'asc'
        }
    });

    // Format response untuk kalender
    const formattedSchedules = schedules.map(schedule => ({
        id: schedule.id,
        title: schedule.ticket ? schedule.ticket.title : schedule.title || schedule.notes,
        start: formatWIB(schedule.start_time),
        end: schedule.end_time ? formatWIB(schedule.end_time) : null,
        status: schedule.status,
        technician: {
            id: schedule.technician.id,
            username: schedule.technician.username,
            full_name: schedule.technician.profile?.full_name || 'N/A',
        },
        ticket: schedule.ticket ? {
            id: schedule.ticket.id,
            title: schedule.ticket.title,
            description: schedule.ticket.description,
            priority: schedule.ticket.priority,
            status: schedule.ticket.status,
            customer: schedule.ticket.customer
        } : null,
        allDay: !schedule.end_time
    }));

    // Hitung statistik (gunakan whereClause yang sama agar konsisten)
    // Kita perlu memisahkan status dari whereClause utama untuk hitung per kategori

    // Clone whereClause dasar tanpa status
    const baseStatWhere = { ...whereClause };
    delete baseStatWhere.status; // Hapus filter status jika ada

    const [scheduledCount, completedCount, cancelledCount] = await Promise.all([
        prisma.detso_Work_Schedule.count({
            where: { ...baseStatWhere, status: 'SCHEDULED' }
        }),
        prisma.detso_Work_Schedule.count({
            where: { ...baseStatWhere, status: 'COMPLETED' }
        }),
        prisma.detso_Work_Schedule.count({
            where: { ...baseStatWhere, status: 'CANCELLED' }
        })
    ]);

    responseData(res, 200, 'Daftar jadwal berhasil diambil', {
        schedules: formattedSchedules,
        month: targetMonth,
        year: targetYear,
        statistics: {
            total: schedules.length,
            scheduled: scheduledCount,
            completed: completedCount,
            cancelled: cancelledCount
        },
        date_range: {
            start: formatWIB(startDate),
            end: formatWIB(endDate)
        }
    });
});

export const getScheduleById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // [NEW] 1. Ambil tenant_id
    const user = req.user;
    if (!user || !user.tenant_id) {
        throw new AuthenticationError('Sesi tidak valid');
    }
    const tenantId = user.tenant_id;

    const { id } = req.params;

    if (!id) {
        throw new NotFoundError("ID jadwal tidak diberikan");
    }

    // [NEW] 2. Cari jadwal dengan ID + Tenant ID (Security)
    // Gunakan findFirst, bukan findUnique
    const schedule = await prisma.detso_Work_Schedule.findFirst({
        where: {
            id: id,
            tenant_id: tenantId, // <--- Filter WAJIB
        },
        include: {
            technician: {
                select: {
                    id: true,
                    username: true,
                    profile: {
                        select: {
                            full_name: true,
                        },
                    },
                },
            },
            ticket: {
                select: {
                    id: true,
                    title: true,
                    description: true,
                    priority: true,
                    status: true,
                    customer: {
                        select: {
                            id: true,
                            name: true,
                            phone: true,
                            address: true,
                        },
                    },
                },
            },
        },
    });

    if (!schedule) {
        // Jika jadwal ada tapi milik tenant lain, tetap return Not Found
        throw new NotFoundError("Jadwal kerja tidak ditemukan");
    }

    const formattedSchedule = {
        id: schedule.id,
        title: schedule.ticket ? schedule.ticket.title : schedule.title || schedule.notes,
        start: formatWIB(schedule.start_time),
        end: schedule.end_time ? formatWIB(schedule.end_time) : null,
        status: schedule.status,
        notes: schedule.notes || null,
        technician: {
            id: schedule.technician.id,
            username: schedule.technician.username,
            full_name: schedule.technician.profile?.full_name || "N/A",
        },
        ticket: schedule.ticket
            ? {
                id: schedule.ticket.id,
                title: schedule.ticket.title,
                description: schedule.ticket.description,
                priority: schedule.ticket.priority,
                status: schedule.ticket.status,
                customer: schedule.ticket.customer,
            }
            : null,
        allDay: !schedule.end_time,
        created_at: formatWIB(schedule.created_at),
        updated_at: schedule.updated_at ? formatWIB(schedule.updated_at) : null,
    };

    responseData(res, 200, "Detail jadwal berhasil diambil", formattedSchedule);
});