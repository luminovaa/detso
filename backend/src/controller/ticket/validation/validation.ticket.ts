import { z } from "zod";

export const paginationSchema = z.object({
  page: z
    .string()
    .default('1')
    .transform((val) => parseInt(val))
    .refine((val) => val > 0, { message: 'Halaman harus lebih besar dari 0' }),
  limit: z
    .string()
    .default('10')
    .transform((val) => parseInt(val))
    .refine((val) => val > 0, { message: 'Batas harus lebih besar dari 0' }),
  search: z.string().trim().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(), 
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  customer_id: z.string().optional(),
});

const optionalNullableTrimmed = z.string().trim().optional().nullable();

export const createTicketSchema = z
  .object({
    service_id: optionalNullableTrimmed,
    customer_id: optionalNullableTrimmed,
    title: z.string().trim().min(1, 'Judul ticket wajib diisi'),
    description: z.string().optional().nullable(),
    type: z.enum(['PROBLEM', 'UPGRADE', 'DOWNGRADE']).optional().default('PROBLEM'),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional().default('MEDIUM'),
    assigned_to: optionalNullableTrimmed,
  })
  .refine((data) => Boolean(data.service_id || data.customer_id), {
    message: 'Layanan atau pelanggan harus diisi',
    path: ['service_id'],
  });

export const updateTicketSchema = z.object({
  title: z.string().trim().min(1, 'Judul ticket wajib diisi').optional(),
  description: z.string().optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  type: z.enum(['PROBLEM', 'UPGRADE', 'DOWNGRADE']).optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  assigned_to: optionalNullableTrimmed,
  service_id: optionalNullableTrimmed,
  resolved_at: z.string().datetime().optional().nullable(),
  image: z.string().optional().nullable(),
});