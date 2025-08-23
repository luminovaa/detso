import { Request, Response } from "express";
import { asyncHandler, NotFoundError, ValidationError } from "../../utils/error-handler";
import { scheduleFilterSchema } from "./validation/validation.schedule";
import { prisma } from "../../utils/prisma";
import { formatWIB } from "../../utils/time-fromat";
import { responseData } from "../../utils/response-handler";

export const getAllSchedules = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // Gabungkan query parameters
    const queryParams = {
        ...req.query,
        ...req.params
    };

    const validationResult = scheduleFilterSchema.safeParse(queryParams);

    if (!validationResult.success) {
        throw new ValidationError('Validasi gagal', validationResult.error.errors);
    }

    const { month, year, technician_id, status } = validationResult.data;

    // Default ke bulan dan tahun sekarang jika tidak disediakan
    const currentDate = new Date();
    const targetMonth = month || currentDate.getMonth() + 1;
    const targetYear = year || currentDate.getFullYear();

    // Hitung tanggal awal dan akhir bulan
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    // Build where clause
    const whereClause: any = {
        AND: [
            {
                start_time: {
                    gte: startDate,
                    lte: endDate
                }
            }
        ]
    };

    // Filter by technician jika ada
    if (technician_id) {
        whereClause.AND.push({
            technician_id: technician_id
        });
    }

    // Filter by status jika ada
    if (status) {
        whereClause.AND.push({
            status: status
        });
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
        allDay: !schedule.end_time // Jika tidak ada end_time, anggap all day
    }));

    const scheduledCount = await prisma.detso_Work_Schedule.count({
        where: {
            ...whereClause,
            status: 'SCHEDULED'
        }
    });

    const completedCount = await prisma.detso_Work_Schedule.count({
        where: {
            ...whereClause,
            status: 'COMPLETED'
        }
    });

    const cancelledCount = await prisma.detso_Work_Schedule.count({
        where: {
            ...whereClause,
            status: 'CANCELLED'
        }
    });

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
  const { id } = req.params;

  if (!id) {
    throw new NotFoundError("ID jadwal tidak diberikan");
  }

  // Cari jadwal di database
  const schedule = await prisma.detso_Work_Schedule.findUnique({
    where: {
      id: id,
    //   deleted_at: null, 
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