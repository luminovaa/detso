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
});

export const createTicketSchema = z.object({
    service_id: z.string().optional(),
    title: z.string().min(5, 'Judul ticket minimal 5 karakter'),
    description: z.string().optional(),
    type: z.enum(['PROBLEM', 'UPGRADE', 'DOWNGRADE']).optional().default('PROBLEM'),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional().default('MEDIUM'),
    assigned_to: z.string().optional()
});

export const updateTicketSchema = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    type: z.enum(['PROBLEM', 'UPGRADE', 'DOWNGRADE']).optional().default('PROBLEM'),
    status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
    assigned_to: z.string().cuid().nullable().optional(),
    service_id: z.string().cuid().nullable().optional(),
    resolved_at: z.string().datetime().optional(),
    image: z.string().optional()
}).strict();