import { z } from 'zod';

export const getAllTenantSchema = z.object({
  page: z.number().default(1),
  limit: z.number().default(10),
  search: z.string().trim().optional(),
  is_active: z.boolean().optional(),
});

export type GetAllTenantInput = z.infer<typeof getAllTenantSchema>;

export const updateTenantSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  is_active: z.boolean().optional(),
});

export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;