import { Request, Response } from 'express';
import { asyncHandler, NotFoundError, ValidationError, AuthenticationError } from '../../utils/error-handler';
import { responseData } from '../../utils/response-handler';
import { prisma } from '../../utils/prisma';
import { createWorkScheduleSchema } from './validation/validation.schedule';

export const createWorkSchedule = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // [NEW] 1. Ambil tenant_id dari user yang login (Admin/Owner/Dispatcher)
  const user = req.user;
  if (!user || !user.tenant_id) {
      throw new AuthenticationError('Sesi tidak valid atau Tenant ID tidak ditemukan');
  }
  const tenantId = user.tenant_id;

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

  // [NEW] 2. Validasi Teknisi (Harus milik Tenant ini)
  const technician = await prisma.detso_User.findFirst({
    where: { 
      id: technician_id,
      tenant_id: tenantId, // <--- WAJIB: Pastikan teknisi adalah karyawan ISP ini
      deleted_at: null 
    }
  });

  if (!technician) {
    // Pesan error umum saja supaya aman
    throw new NotFoundError('Teknisi tidak ditemukan atau bukan dari divisi Anda');
  }

  // Opsional: Cek apakah user tersebut benar-benar punya role TEKNISI?
  // if (technician.role !== 'TENANT_TEKNISI') { ... }

  // [NEW] 3. Validasi Tiket (Harus milik Tenant ini)
  if (ticket_id) {
    const ticket = await prisma.detso_Ticket.findFirst({
      where: { 
        id: ticket_id,
        tenant_id: tenantId, // <--- WAJIB: Pastikan tiket milik ISP ini
        deleted_at: null 
      }
    });

    if (!ticket) {
      throw new NotFoundError('Tiket tidak ditemukan');
    }

    // Cek apakah tiket sudah punya jadwal (Global check boleh, karena ticket_id unique)
    // Tapi lebih aman pakai findFirst + tenant_id biar konsisten
    const existingSchedule = await prisma.detso_Work_Schedule.findUnique({
      where: { ticket_id } 
    });

    if (existingSchedule) {
      throw new ValidationError('Tiket ini sudah dijadwalkan sebelumnya');
    }
  }

  // [NEW] 4. Buat Jadwal dengan tenant_id
  const schedule = await prisma.detso_Work_Schedule.create({
    data: {
      tenant_id: tenantId, // <--- INJECT TENANT ID
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