import { title } from "process";
import { z } from "zod";

export const createWorkScheduleSchema = z.object({
  technician_id: z.string().min(1, 'ID teknisi harus diisi'),
  title: z.string().optional().nullable(),
  start_time: z.string().datetime('Format waktu tidak valid'),
  end_time: z.string().datetime('Format waktu tidak valid').optional().nullable(),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED']).default('SCHEDULED'),
  notes: z.string().optional().nullable(),
  ticket_id: z.string().optional().nullable() 
});

export const scheduleFilterSchema = z.object({
  month: z.coerce.number().min(1).max(12).optional(), 
  year: z.coerce.number().min(2000).max(2100).optional(),
  technician_id: z.string().optional(),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED']).optional()
});

export const updateScheduleSchema = z.object({
  technician_id: z.string().min(1, 'ID teknisi harus diisi').optional(),
  title: z.string().optional().nullable(),
  start_time: z.string().datetime('Format waktu tidak valid').optional(),
  end_time: z.string().datetime('Format waktu tidak valid').optional().nullable(),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED']).optional(),
  notes: z.string().optional().nullable(),
  ticket_id: z.string().optional().nullable()
});