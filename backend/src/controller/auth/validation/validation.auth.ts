import { Detso_Role } from "@prisma/client";
import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().min(3, 'Username/email harus minimal 3 karakter'),
  password: z.string().min(6, 'Kata sandi harus minimal 6 karakter')
})


export const refreshTokenSchema = z.object({
    refreshToken: z.string().optional()
})
export const registerSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  phone: z.string().min(10, 'Nomor telepon minimal 10 karakter'),
  username: z.string().min(3, 'Username minimal 3 karakter'),
  role: z.enum([Detso_Role.TENANT_OWNER]).optional(),
  full_name: z.string().min(3, 'Nama lengkap minimal 3 karakter').optional(),
  company_name: z.string().min(3, 'Nama perusahaan minimal 3 karakter').optional()
})

export const createUserSchema = z.object({
  email: z.string().email('Email tidak valid'),
  username: z.string().min(3, 'Username minimal 3 karakter'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  full_name: z.string().min(1, 'Nama lengkap wajib diisi'),
  phone: z.string().optional(),
  // Role opsional, default nanti ke TEKNISI. 
  // Hanya boleh pilih role level Tenant, bukan SAAS_SUPER_ADMIN
  role: z.enum([Detso_Role.TENANT_ADMIN, Detso_Role.TENANT_TEKNISI]).optional(),
});