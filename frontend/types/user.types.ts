import { Profile } from "./profile.types";
import { z } from "zod";

export type User = {
    id?: string;
    username: string;
    email: string;
    password: string;
    created_at?: Date;
    updated_at?: Date;
    role?: role;
    phone?: string;
    profile?: Profile;
}


export enum role {
    TEKNISI = "TEKNISI",
    ADMIN = "ADMIN",
    SUPER_ADMIN = "SUPER_ADMIN"
}

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
  role: z.enum(["SUPER_ADMIN", "ADMIN", "TEKNISI"]).nonoptional({ message: "Role wajib dipilih" }),
  full_name: z
    .string()
    .min(2, "Nama lengkap minimal 2 karakter")
    .max(100, "Nama lengkap maksimal 100 karakter"),
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  email: z
    .string()
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
  role: z.enum(['TEKNISI', 'ADMIN', 'SUPER_ADMIN']).optional(),
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