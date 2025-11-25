import { z } from 'zod'

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
    .refine((val) => val > 0, { message: 'Batas harus lebih besar dari 0' })
})

export const updatePackageSchema = z.object({
  name: z.string().min(3, 'Nama paket harus minimal 3 karakter').optional(), // Optional agar bisa update parsial
  speed: z.string().min(1, 'Kecepatan harus diisi'),
  price: z.number().optional(),
}).strict()

export const createPackageSchema = z.object({
  name: z.string().min(3, 'Nama paket harus minimal 3 karakter'),
  speed: z.string().min(1, 'Kecepatan harus diisi'),
  price: z.number().nonnegative().optional(),
}).strict()

export const packageIdSchema = z.object({
  id: z.string().min(1, 'ID tidak valid'),
});