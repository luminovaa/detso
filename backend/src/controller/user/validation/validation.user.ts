import { z } from 'zod'

// [NEW] Definisi Role Tenant yang valid
const TENANT_ROLES = ['TENANT_OWNER', 'TENANT_ADMIN', 'TENANT_TEKNISI'] as const;

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
  
  // [UPDATED] Update Enum Role untuk Filter
  role: z.enum(TENANT_ROLES).optional(),
})

export const updateUserSchema = z.object({
  email: z.string().email('Email tidak valid').optional(),
  username: z.string().min(3, 'Username minimal 3 karakter').optional(),
  
  // [UPDATED] Update Enum Role untuk Edit User
  // Admin Tenant bisa mengubah role karyawan, tapi validasi hirarki 
  // (misal Admin gak boleh edit Owner) tetap dilakukan di Controller.
  role: z.enum(TENANT_ROLES).optional(),
  
  full_name: z.string().optional(),
  phone: z.string().optional(),
  avatar: z.string().optional(),
})

// Schema Password tidak ada perubahan, sudah oke.
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