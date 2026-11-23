import { z } from 'zod';
import { basePaginationSchema } from '@/src/lib/base-schemas';
import { translateSchema } from '@/src/features/i18n/store';

export const getAllTicketSchema = basePaginationSchema.extend({
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  customer_id: z.string().optional(),
});

export type GetAllTicketInput = z.infer<typeof getAllTicketSchema>;

export const createCreateTicketSchema = (locale?: 'en' | 'id') =>
  z
    .object({
      service_id: z.string().optional().or(z.literal('')),
      customer_id: z.string().optional().or(z.literal('')),
      title: z.string().trim().min(1, translateSchema('validation.ticketTitleRequired', locale)),
      description: z.string().optional().nullable(),
      type: z.enum(['PROBLEM', 'UPGRADE', 'DOWNGRADE']).optional(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
      assigned_to: z.string().optional().nullable(),
    })
    .refine((data) => Boolean(data.service_id?.trim() || data.customer_id?.trim()), {
      message: translateSchema('validation.serviceOrCustomerRequired', locale),
      path: ['service_id'],
    });

export const createTicketSchema = createCreateTicketSchema();

export type CreateTicketInput = z.infer<typeof createTicketSchema>;

export const createUpdateTicketSchema = (locale?: 'en' | 'id') =>
  z.object({
    title: z.string().trim().min(1, translateSchema('validation.ticketTitleRequired', locale)).optional(),
    description: z.string().optional().nullable(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    type: z.enum(['PROBLEM', 'UPGRADE', 'DOWNGRADE']).optional(),
    status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
    assigned_to: z.string().nullable().optional(),
    service_id: z.string().nullable().optional(),
    resolved_at: z.string().datetime().optional().nullable(),
  });

export const updateTicketSchema = createUpdateTicketSchema();

export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;