import { z } from 'zod';

export enum Detso_Role {
  SAAS_SUPER_ADMIN = 'SAAS_SUPER_ADMIN',
  TENANT_OWNER = 'TENANT_OWNER',
  TENANT_ADMIN = 'TENANT_ADMIN',
  TENANT_TEKNISI = 'TENANT_TEKNISI',
}

export const loginSchema = z.object({
  identifier: z.string().min(3, 'Username/email harus minimal 3 karakter'),
  password: z.string().min(3, 'Kata sandi harus minimal 6 karakter'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  phone: z.string().min(10, 'Nomor telepon minimal 10 karakter'),
  username: z.string().min(3, 'Username minimal 3 karakter'),
  address: z.string().min(3, 'Alamat minimal 3 karakter'),
  lat: z.string().optional().or(z.literal('')),
  long: z.string().optional().or(z.literal('')),
  full_name: z.string().min(3, 'Nama lengkap minimal 3 karakter'),
  company_name: z.string().min(3, 'Nama perusahaan minimal 3 karakter'),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const createUserSchema = z.object({
  email: z.string().email('Email tidak valid'),
  username: z.string().min(3, 'Username minimal 3 karakter'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  full_name: z.string().min(1, 'Nama lengkap wajib diisi'),
  phone: z.string().optional().or(z.literal('')),
  // Hanya boleh pilih role level Tenant
  role: z.enum([Detso_Role.TENANT_ADMIN, Detso_Role.TENANT_TEKNISI]).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;