import { Request, Response } from 'express';
import { asyncHandler, NotFoundError, ValidationError } from '../../utils/error-handler';
import { updateScheduleSchema } from './validation/validation.schedule';
import { prisma } from '../../utils/prisma';
import { responseData } from '../../utils/response-handler';

export const editSchedule = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const scheduleId = req.params.id;

  const validationResult = updateScheduleSchema.safeParse(req.body);

  if (!validationResult.success) {
    throw new ValidationError('Validasi gagal', validationResult.error.errors);
  }

  const {
    technician_id,
    start_time,
    end_time,
    title,
    status,
    notes,
    ticket_id
  } = validationResult.data;

  // Cek apakah schedule ada
  const existingSchedule = await prisma.detso_Work_Schedule.findUnique({
    where: { 
      id: scheduleId 
    },
    include: {
      technician: true,
      ticket: true
    }
  });

  if (!existingSchedule) {
    throw new NotFoundError('Schedule tidak ditemukan');
  }

  // Validasi technician jika diupdate
  if (technician_id && technician_id !== existingSchedule.technician_id) {
    const technician = await prisma.detso_User.findUnique({
      where: { 
        id: technician_id, 
        deleted_at: null 
      }
    });

    if (!technician) {
      throw new NotFoundError('Teknisi tidak ditemukan');
    }
  }

  // Validasi ticket jika diupdate
  if (ticket_id !== undefined && ticket_id !== existingSchedule.ticket_id) {
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

      // Cek apakah tiket sudah memiliki schedule lain
      const existingTicketSchedule = await prisma.detso_Work_Schedule.findFirst({
        where: { 
          ticket_id: ticket_id,
          id: { not: scheduleId }
        }
      });

      if (existingTicketSchedule) {
        throw new ValidationError('Tiket sudah memiliki jadwal lain');
      }
    }
  }

  // Update schedule
  const updatedSchedule = await prisma.$transaction(async (tx) => {
    const schedule = await tx.detso_Work_Schedule.update({
      where: { id: scheduleId },
      data: {
        title: title !== undefined ? title : undefined,
        technician_id: technician_id !== undefined ? technician_id : undefined,
        start_time: start_time ? new Date(start_time) : undefined,
        end_time: end_time !== undefined ? (end_time ? new Date(end_time) : null) : undefined,
        status: status !== undefined ? status : undefined,
        notes: notes !== undefined ? notes : undefined,
        ticket_id: ticket_id !== undefined ? ticket_id : undefined,
        updated_at: new Date()
      },
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
        ticket: ticket_id ? {
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
                phone: true
              }
            }
          }
        } : undefined
      }
    });

    // Jika ticket_id diubah, update juga assigned_to di ticket
    if (ticket_id !== undefined && ticket_id !== existingSchedule.ticket_id) {
      if (ticket_id) {
        // Update ticket dengan technician yang baru
        await tx.detso_Ticket.update({
          where: { id: ticket_id },
          data: {
            assigned_to: technician_id || existingSchedule.technician_id,
            updated_at: new Date()
          }
        });

        // Buat history untuk penugasan
        await tx.detso_Ticket_History.create({
          data: {
            ticket_id: ticket_id,
            action: 'ASSIGNED',
            description: `Tiket ditugaskan kepada teknisi: ${technician_id || existingSchedule.technician_id} melalui update schedule`,
            created_by: req.user?.id || null,
            created_at: new Date()
          }
        });
      } else if (existingSchedule.ticket_id) {
        // Jika ticket_id dihapus (di-set null), hapus assigned_to dari ticket lama
        await tx.detso_Ticket.update({
          where: { id: existingSchedule.ticket_id },
          data: {
            assigned_to: null,
            updated_at: new Date()
          }
        });
      }
    }

    // Buat history untuk perubahan schedule
    if (technician_id && technician_id !== existingSchedule.technician_id) {
      await tx.detso_Ticket_History.create({
        data: {
          ticket_id: existingSchedule.ticket_id || ticket_id  || '',
          action: 'ASSIGNED',
          description: `Teknisi diubah dari ${existingSchedule.technician_id} menjadi ${technician_id}`,
          created_by: req.user?.id || null,
          created_at: new Date()
        }
      });
    }

    if (status && status !== existingSchedule.status) {
      await tx.detso_Ticket_History.create({
        data: {
          ticket_id: existingSchedule.ticket_id || ticket_id || '',
          action: 'STATUS_CHANGED',
          description: `Status schedule diubah dari ${existingSchedule.status} menjadi ${status}`,
          created_by: req.user?.id || null,
          created_at: new Date()
        }
      });
    }

    return schedule;
  });

  const data = {
    id: updatedSchedule.id,
    technician_id: updatedSchedule.technician_id,
    ticket_id: updatedSchedule.ticket_id,
    start_time: updatedSchedule.start_time,
    end_time: updatedSchedule.end_time,
    status: updatedSchedule.status,
    notes: updatedSchedule.notes,
    created_at: updatedSchedule.created_at,
    updated_at: updatedSchedule.updated_at,
    technician: updatedSchedule.technician ? {
      id: updatedSchedule.technician.id,
      username: updatedSchedule.technician.username,
      full_name: updatedSchedule.technician.profile?.full_name || 'N/A',
    } : null,
    ticket: updatedSchedule.ticket ? {
      id: updatedSchedule.ticket.id,
      title: updatedSchedule.ticket.title,
      description: updatedSchedule.ticket.description,
      priority: updatedSchedule.ticket.priority,
      status: updatedSchedule.ticket.status,
    } : null
  };

  responseData(res, 200, 'Schedule berhasil diperbarui', data);
});