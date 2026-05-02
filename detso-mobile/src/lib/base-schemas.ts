import { z } from 'zod';

/**
 * Base pagination schema yang digunakan oleh semua list/getAll endpoints.
 * Extend schema ini untuk menambahkan filter spesifik per feature.
 *
 * @example
 * export const getAllTicketSchema = basePaginationSchema.extend({
 *   priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
 *   status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
 * });
 */
export const basePaginationSchema = z.object({
  page: z.number().default(1),
  limit: z.number().default(10),
  search: z.string().trim().optional(),
});

export type BasePaginationInput = z.infer<typeof basePaginationSchema>;
