import { z } from 'zod';

const TENANT_ROLES = ['TENANT_OWNER', 'TENANT_ADMIN', 'TENANT_TEKNISI'] as const;

export const getAllUserSchema = z.object({
  page: z.number().default(1),
  limit: z.number().default(10),
  search: z.string().trim().optional(),
  role: z.enum(TENANT_ROLES).optional(),
});

export type GetAllUserInput = z.infer<typeof getAllUserSchema>;

export const updateUserSchema = z.object({
  email: z.string().email('Email tidak valid').optional().or(z.literal('')),
  username: z.string().min(3, 'Username minimal 3 karakter').optional().or(z.literal('')),
  role: z.enum(TENANT_ROLES).optional(),
  full_name: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const updatePasswordSchema = z
  .object({
    oldPassword: z.string().min(6, 'Password lama wajib diisi'),
    password: z.string().min(6, 'Password baru minimal 6 karakter'),
    confirmPassword: z.string().min(6, 'Konfirmasi password wajib diisi'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Password baru dan konfirmasi tidak cocok',
    path: ['confirmPassword'],
  });

export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;