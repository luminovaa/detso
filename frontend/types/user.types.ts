import { Profile } from "./profile.types";
import { z } from "zod";

// [UPDATED] Sesuaikan Enum dengan Backend
export enum role {
  SAAS_SUPER_ADMIN = "SAAS_SUPER_ADMIN",
  TENANT_OWNER = "TENANT_OWNER",
  TENANT_ADMIN = "TENANT_ADMIN",
  TENANT_TEKNISI = "TENANT_TEKNISI"
}

// [UPDATED] Tambahkan tenant_id ke tipe data User
export type User = {
  id?: string;
  username: string;
  email: string;
  password?: string; // Password opsional karena tidak selalu dikembalikan backend
  created_at?: Date;
  updated_at?: Date;
  role?: role;
  tenant_id?: string | null; // [NEW] Penting untuk logika frontend
  phone?: string;
  profile?: Profile;
  avatar?: string;
  full_name?: string;
}

// Schema untuk "Add User" (Biasanya dilakukan oleh Owner/Admin untuk nambah karyawan)
export const createUserSchema = z.object({
  email: z
    .string()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid"),
  username: z
    .string()
    .min(3, "Username minimal 3 karakter")
    .max(20, "Username maksimal 20 karakter")
    .regex(/^[a-zA-Z0-9_]+$/, "Username hanya boleh berisi huruf, angka, dan underscore"),
  password: z
    .string()
    .min(6, "Password minimal 6 karakter")
    .max(50, "Password maksimal 50 karakter"),
  phone: z
    .string()
    .min(10, "Nomor telepon minimal 10 digit")
    .max(15, "Nomor telepon maksimal 15 digit")
    .regex(/^[0-9+\-\s]+$/, "Nomor telepon tidak valid"),

  // [UPDATED] Role selection untuk Create User
  // Kita batasi hanya bisa buat Admin Kantor atau Teknisi. 
  // Tidak bisa buat Owner (harus register) atau Super Admin.
  role: z.enum(['TENANT_OWNER', 'TENANT_ADMIN', 'TENANT_TEKNISI']).optional(),

  full_name: z
    .string()
    .min(2, "Nama lengkap minimal 2 karakter")
    .max(100, "Nama lengkap maksimal 100 karakter"),
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;

export const createUserTenantSchema = z.object({
  email: z
    .string()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid"),
  username: z
    .string()
    .min(3, "Username minimal 3 karakter")
    .max(20, "Username maksimal 20 karakter")
    .regex(/^[a-zA-Z0-9_]+$/, "Username hanya boleh berisi huruf, angka, dan underscore"),
  password: z
    .string()
    .min(6, "Password minimal 6 karakter")
    .max(50, "Password maksimal 50 karakter"),
  phone: z
    .string()
    .min(10, "Nomor telepon minimal 10 digit")
    .max(15, "Nomor telepon maksimal 15 digit")
    .regex(/^[0-9+\-\s]+$/, "Nomor telepon tidak valid"),

  // [UPDATED] Role selection untuk Create User
  // Kita batasi hanya bisa buat Admin Kantor atau Teknisi. 
  // Tidak bisa buat Owner (harus register) atau Super Admin.
  role: z.enum(['TENANT_OWNER', 'TENANT_ADMIN', 'TENANT_TEKNISI']).optional(),

  full_name: z
    .string()
    .min(2, "Nama lengkap minimal 2 karakter")
    .max(100, "Nama lengkap maksimal 100 karakter"),

  company_name: z
    .string()
    .min(2, "Nama perusahaan minimal 2 karakter")
    .max(100, "Nama perusahaan maksimal 100 karakter"),
});

export type CreateUserTenantFormData = z.infer<typeof createUserTenantSchema>;

export const updateUserSchema = z.object({
  email: z
    .email('Email tidak valid')
    .optional()
    .or(z.literal('')),
  username: z
    .string()
    .min(3, 'Username minimal 3 karakter')
    .max(20, 'Username maksimal 20 karakter')
    .regex(/^[a-zA-Z0-9_]+$/, "Username hanya boleh berisi huruf, angka, dan underscore")
    .optional()
    .or(z.literal('')),

  // [UPDATED] Role selection untuk Update User
  // Owner mungkin bisa downgrade Admin jadi Teknisi, atau sebaliknya.
  role: z.enum(['TENANT_OWNER', 'TENANT_ADMIN', 'TENANT_TEKNISI']).optional(),

  full_name: z
    .string()
    .min(2, 'Nama lengkap minimal 2 karakter')
    .max(100, 'Nama lengkap maksimal 100 karakter')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .min(10, "Nomor telepon minimal 10 digit")
    .max(15, "Nomor telepon maksimal 15 digit")
    .regex(/^[0-9+\-\s]+$/, "Nomor telepon tidak valid")
    .optional()
    .or(z.literal('')),
  avatar: z.string().optional(),
});

export type UpdateUserFormData = z.infer<typeof updateUserSchema>;