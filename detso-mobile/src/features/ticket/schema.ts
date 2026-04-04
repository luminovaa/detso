import { z } from 'zod';

export const getAllTicketSchema = z.object({
  page: z.number().default(1),
  limit: z.number().default(10),
  search: z.string().trim().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
});

export type GetAllTicketInput = z.infer<typeof getAllTicketSchema>;

export const createTicketSchema = z.object({
  service_id: z.string().optional().nullable(),
  title: z.string().min(5, 'Judul ticket minimal 5 karakter'),
  description: z.string().optional().nullable(),
  type: z.enum(['PROBLEM', 'UPGRADE', 'DOWNGRADE']).optional().default('PROBLEM'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional().default('MEDIUM'),
  assigned_to: z.string().optional().nullable(),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;

export const updateTicketSchema = z.object({
  title: z.string().optional().or(z.literal('')),
  description: z.string().optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  type: z.enum(['PROBLEM', 'UPGRADE', 'DOWNGRADE']).optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  assigned_to: z.string().nullable().optional(),
  service_id: z.string().nullable().optional(),
  resolved_at: z.string().datetime().optional().nullable(),
  image: z.any().optional(), // Used for FormData file uploads
});

export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;