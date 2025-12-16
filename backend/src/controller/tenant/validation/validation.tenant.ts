import { z } from "zod";

export const tenantPaginationSchema = z.object({
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
  is_active: z.enum(['true', 'false']).optional(), // Filter status aktif/nonaktif
});

export const updateTenantSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  // is_active dikirim sebagai string 'true'/'false' via form-data
  is_active: z.enum(['true', 'false']).optional(), 
});