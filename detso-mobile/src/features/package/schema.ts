import { z } from 'zod';

export const getAllPackageSchema = z.object({
  page: z.number().default(1),
  limit: z.number().default(10),
  search: z.string().trim().optional(),
});

export type GetAllPackageInput = z.infer<typeof getAllPackageSchema>;

export const createPackageSchema = z.object({
  name: z.string().min(3, 'Nama paket harus minimal 3 karakter'),
  speed: z.string().min(1, 'Kecepatan harus diisi'),
  price: z.coerce.number().nonnegative('Harga tidak boleh negatif').optional(),
});

export type CreatePackageInput = z.infer<typeof createPackageSchema>;

export const updatePackageSchema = z.object({
  name: z.string().min(3, 'Nama paket harus minimal 3 karakter').optional().or(z.literal('')),
  speed: z.string().min(1, 'Kecepatan harus diisi').optional().or(z.literal('')),
  price: z.coerce.number().nonnegative('Harga tidak boleh negatif').optional(),
});

export type UpdatePackageInput = z.infer<typeof updatePackageSchema>;

export const packageIdSchema = z.object({
  id: z.string().min(1, 'ID tidak valid'),
});

export type PackageIdInput = z.infer<typeof packageIdSchema>;