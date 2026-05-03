import { Request, Response } from 'express';
import { asyncHandler, NotFoundError, ValidationError, AuthenticationError } from '../../utils/error-handler';
import { updateScheduleSchema } from './validation/validation.schedule';
import { prisma } from '../../utils/prisma';
import { responseData } from '../../utils/response-handler';
import { getParam } from '../../utils/request.utils';
import { deleteFile, getUploadedFileInfo } from '../../config/upload-file';
import { generateFullUrl } from '../../utils/generate-full-url';
import { formatWIB } from '../../utils/time-fromat';

export const editSchedule = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // [NEW] 1. Ambil tenant_id
  const user = req.user;
  if (!user || !user.tenant_id) {
      throw new AuthenticationError('Sesi tidak valid atau Tenant ID tidak ditemukan');
  }
  const tenant_id = user.tenant_id;

  const scheduleId = getParam(req.params.id);

  // Handle file cleanup on error
  const cleanupUploadedFile = async () => {
    if (req.file) {
      await deleteFile(req.file.path).catch(err =>
        console.error('Gagal menghapus file:', err)
      );
    }
  };

  // Get uploaded file info if exists
  let uploadedImage: { path: string; fileName: string; fullPath: string } | undefined;
  if (req.file) {
    uploadedImage = getUploadedFileInfo(req.file, 'storage/public/schedules');
  }

  const validationResult = updateScheduleSchema.safeParse({
    ...req.body,
    image: uploadedImage?.path
  });

  if (!validationResult.success) {
    await cleanupUploadedFile();
    throw new ValidationError('Validasi gagal', validationResult.error.issues);
  }

  const {
    technician_id,
    start_time,
    end_time,
    title,
    status,
    notes,
    ticket_id,
    image
  } = validationResult.data;

  // [NEW] 2. Cek Schedule (Wajib milik Tenant ini)
  // Gunakan findFirst bukan findUnique agar bisa filter tenant_id
  const existingSchedule = await prisma.detso_Work_Schedule.findFirst({
    where: { 
      id: scheduleId,
      tenant_id: tenant_id // <--- Filter Tenant
    },
    include: {
      technician: true,
      ticket: true
    }
  });

  if (!existingSchedule) {
    await cleanupUploadedFile();
    throw new NotFoundError('Schedule tidak ditemukan atau akses ditolak');
  }

  // [NEW] 3. Validasi Teknisi Baru (Jika diubah, wajib milik Tenant ini)
  if (technician_id && technician_id !== existingSchedule.technician_id) {
    const technician = await prisma.detso_User.findFirst({
      where: { 
        id: technician_id, 
        tenant_id: tenant_id, // <--- Filter Tenant
        deleted_at: null 
      }
    });

    if (!technician) {
      await cleanupUploadedFile();
      throw new NotFoundError('Teknisi tidak ditemukan di data perusahaan Anda');
    }
  }

  // [NEW] 4. Validasi Tiket Baru (Jika diubah, wajib milik Tenant ini)
  if (ticket_id !== undefined && ticket_id !== existingSchedule.ticket_id) {
    if (ticket_id) {
      const ticket = await prisma.detso_Ticket.findFirst({
        where: { 
          id: ticket_id, 
          tenant_id: tenant_id, // <--- Filter Tenant
          deleted_at: null 
        }
      });

      if (!ticket) {
        await cleanupUploadedFile();
        throw new NotFoundError('Tiket tidak ditemukan');
      }

      // Cek apakah tiket sudah memiliki schedule lain (di tenant ini)
      const existingTicketSchedule = await prisma.detso_Work_Schedule.findFirst({
        where: { 
          ticket_id: ticket_id,
          tenant_id: tenant_id, // Safety check extra
          id: { not: scheduleId }
        }
      });

      if (existingTicketSchedule) {
        await cleanupUploadedFile();
        throw new ValidationError('Tiket sudah memiliki jadwal lain');
      }
    }
  }

  // Update schedule & Relasi
  const updatedSchedule = await prisma.$transaction(async (tx) => {
    // Update data schedule utama
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
        image: image !== undefined ? image : undefined,
        updated_at: new Date()
      },
      include: {
        technician: {
          select: {
            id: true,
            username: true,
            profile: {
              select: { full_name: true }
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
                    select: { id: true, name: true, phone: true }
                }
            }
        } 
      }
    });

    // Logika Sinkronisasi ke Tiket & History
    // (Logika ini sebagian besar sama, tapi karena kita sudah validasi tenant_id di atas,
    //  operasi update by ID di sini aman karena ID-nya sudah terverifikasi milik tenant)

    // A. Jika Ticket ID berubah
    if (ticket_id !== undefined && ticket_id !== existingSchedule.ticket_id) {
      if (ticket_id) {
        // Assign ke tiket baru
        await tx.detso_Ticket.update({
          where: { id: ticket_id },
          data: {
            assigned_to: technician_id || existingSchedule.technician_id,
            updated_at: new Date()
          }
        });

        await tx.detso_Ticket_History.create({
          data: {
            ticket_id: ticket_id,
            action: 'ASSIGNED',
            description: `Tiket ditugaskan kepada teknisi melalui update schedule`,
            created_by: user.id,
            created_at: new Date()
          }
        });
      } 
      
      // Unassign dari tiket lama (jika ada)
      if (existingSchedule.ticket_id) {
        await tx.detso_Ticket.update({
          where: { id: existingSchedule.ticket_id },
          data: {
            assigned_to: null,
            updated_at: new Date()
          }
        });
      }
    }
    // B. Jika Ticket ID sama, tapi Teknisi berubah
    else if (ticket_id === undefined || ticket_id === existingSchedule.ticket_id) {
        // Pastikan ada tiket yang terkait
        const currentTicketId = existingSchedule.ticket_id;
        if (currentTicketId && technician_id && technician_id !== existingSchedule.technician_id) {
             await tx.detso_Ticket.update({
                where: { id: currentTicketId },
                data: {
                    assigned_to: technician_id,
                    updated_at: new Date()
                }
            });

            await tx.detso_Ticket_History.create({
                data: {
                  ticket_id: currentTicketId,
                  action: 'ASSIGNED',
                  description: `Teknisi diubah dari jadwal kerja`,
                  created_by: user.id,
                  created_at: new Date()
                }
            });
        }
    }

    // History Log untuk Perubahan Status Schedule
    const activeTicketId = schedule.ticket_id || existingSchedule.ticket_id;
    if (activeTicketId && status && status !== existingSchedule.status) {
      await tx.detso_Ticket_History.create({
        data: {
          ticket_id: activeTicketId,
          action: 'STATUS_CHANGED',
          description: `Status schedule diubah menjadi ${status}`,
          created_by: user.id,
          created_at: new Date()
        }
      });
    }

    return schedule;
  });

  // Format response konsisten dengan Schedule type di frontend
  const data = {
    id: updatedSchedule.id,
    title: updatedSchedule.ticket ? updatedSchedule.ticket.title : updatedSchedule.title || updatedSchedule.notes,
    technician_id: updatedSchedule.technician_id,
    ticket_id: updatedSchedule.ticket_id || null,
    start_time: formatWIB(updatedSchedule.start_time),
    end_time: updatedSchedule.end_time ? formatWIB(updatedSchedule.end_time) : null,
    status: updatedSchedule.status,
    notes: updatedSchedule.notes,
    image: generateFullUrl(updatedSchedule.image),
    created_at: formatWIB(updatedSchedule.created_at),
    updated_at: updatedSchedule.updated_at ? formatWIB(updatedSchedule.updated_at) : null,
    technician: updatedSchedule.technician ? {
      id: updatedSchedule.technician.id,
      username: updatedSchedule.technician.username,
      full_name: updatedSchedule.technician.profile?.full_name || 'N/A',
    } : null,
    ticket: updatedSchedule.ticket || null
  };

  responseData(res, 200, 'Schedule berhasil diperbarui', data);
});