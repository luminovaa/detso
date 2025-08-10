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
    .refine((val) => val > 0, { message: 'Batas harus lebih besar dari 0' }),
  search: z.string().trim().optional(),
  role: z.enum(['ADMIN', 'SUPER_ADMIN', 'TEKNISI']).optional(),
})

export const updateUserSchema = z.object({
  email: z.string().email('Email tidak valid').optional(),
  username: z.string().min(3, 'Username minimal 3 karakter').optional(),
  role: z.enum(['TEKNISI', 'ADMIN', 'SUPER_ADMIN']).optional(),
  full_name: z.string().optional(),
  phone: z.string().optional(),
  avatar: z.string().optional(),
})

export const updatePasswordSchema = z
  .object({
    oldPassword: z.string().min(6, 'Password lama wajib diisi'),
    password: z.string().min(6, 'Password baru minimal 6 karakter'),
    confirmPassword: z.string().min(6, 'Konfirmasi password wajib diisi')
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Password baru dan konfirmasi tidak cocok',
    path: ['confirmPassword']
  })
