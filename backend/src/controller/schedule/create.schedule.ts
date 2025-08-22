import { Request, Response } from 'express';
import { asyncHandler, NotFoundError, ValidationError } from '../../utils/error-handler';
import { responseData } from '../../utils/response-handler';
import { prisma } from '../../utils/prisma';
import { createWorkScheduleSchema } from './validation/validation.schedule';

export const createWorkSchedule = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const validationResult = createWorkScheduleSchema.safeParse(req.body);

  if (!validationResult.success) {
    throw new ValidationError('Validasi gagal', validationResult.error.errors);
  }

  const {
    technician_id,
    start_time,
    end_time,
    status,
    notes,
    title,
    ticket_id
  } = validationResult.data;

  const technician = await prisma.detso_User.findUnique({
    where: { 
      id: technician_id, 
      deleted_at: null 
    }
  });

  if (!technician) {
    throw new NotFoundError('Teknisi tidak ditemukan');
  }

  if (ticket_id) {
    const ticket = await prisma.detso_Ticket.findUnique({
      where: { 
        id: ticket_id, 
        deleted_at: null 
      }
    });

    if (!ticket) {
      throw new NotFoundError('Tiket tidak ditemukan');
    }

    const existingSchedule = await prisma.detso_Work_Schedule.findUnique({
      where: { ticket_id }
    });

    if (existingSchedule) {
      throw new ValidationError('Tiket sudah memiliki jadwal');
    }
  }

  const schedule = await prisma.detso_Work_Schedule.create({
    data: {
        title: title || null,
      technician_id,
      start_time: new Date(start_time),
      end_time: end_time ? new Date(end_time) : null,
      status,
      notes,
      ticket_id: ticket_id || null,
      created_at: new Date()
    },
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
      },
      ticket: ticket_id ? {
        select: {
          id: true,
          title: true,
          status: true
        }
      } : undefined
    }
  });

  responseData(res, 201, 'Jadwal kerja berhasil dibuat', schedule);
});