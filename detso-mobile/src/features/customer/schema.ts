import { z } from 'zod';

const documentSchema = z.object({
  type: z.string().min(1, { message: 'Jenis dokumen wajib diisi' }),
  id: z.string().optional(),
});

// Schema utama untuk update customer
export const updateCustomerSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Nama wajib diisi' })
    .max(100, { message: 'Nama maksimal 100 karakter' })
    .optional(),

  phone: z
    .string()
    .min(1, { message: 'Nomor telepon wajib diisi' })
    .regex(/^[\d+][\d\s\-()]{6,15}$/, { message: 'Nomor telepon tidak valid' })
    .optional(),

  email: z
    .email({ message: 'Email tidak valid' })
    .optional()
    .nullable()
    .or(z.literal('')),

  birth_date: z.preprocess((arg) => {
    if (!arg || arg === '') return undefined;
    const date = new Date(String(arg));
    return isNaN(date.getTime()) ? undefined : date;
  }, z.date().optional()),
  
  birth_place: z.string().optional(),
  
  nik: z
    .string()
    .length(16, { message: 'NIK harus tepat 16 digit' })
    .regex(/^\d{16}$/, { message: 'NIK hanya boleh angka' })
    .optional(),

  documents: z
    .array(documentSchema)
    .max(5, { message: 'Maksimal 5 dokumen' })
    .optional()
    .default([]),
}).refine(data => {
  // Jika ada documents, pastikan tidak ada duplikat type
  const types = data.documents?.map(d => d.type);
  const uniqueTypes = new Set(types);
  if (types && types.length !== uniqueTypes.size) {
    return false;
  }
  return true;
}, {
  message: 'Tidak boleh ada jenis dokumen yang duplikat (misal: dua KTP)',
  path: ['documents']
});

export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;

// Schema untuk foto
const photoSchema = z.object({
  type: z.string().min(1, 'Jenis foto harus diisi'),
});

export const createCustomerSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  phone: z.string().min(10, 'Nomor telepon minimal 10 karakter').optional(),
  email: z.email('Email tidak valid').optional().or(z.literal('')),
  nik: z.string().length(16, 'NIK harus 16 karakter').regex(/^\d+$/, 'NIK hanya boleh angka').optional().or(z.literal('')),
  package_id: z.string().min(1, 'Paket harus dipilih'),
  address_service: z.string().min(10, 'Alamat instalasi minimal 10 karakter'),
  address: z.string().min(10, 'Alamat KTP minimal 10 karakter'),
  package_name: z.string().optional(),
  package_speed: z.string().optional(),
  package_price: z.number().optional(),
  ip_address: z.ipv4('Alamat IP tidak valid').optional().or(z.literal('')),
  lat: z.string().optional(),
  long: z.string().optional(),
  birth_date: z.preprocess((arg) => {
    if (!arg || arg === '') return undefined;
    const date = new Date(String(arg));
    return isNaN(date.getTime()) ? undefined : date;
  }, z.date().optional()),
  birth_place: z.string().optional(),
  mac_address: z.string().min(12, 'MAC address minimal 12 karakter').optional().or(z.literal('')),
  notes: z.string().optional(),
  documents: z.array(documentSchema).optional(),
  photos: z.array(photoSchema).optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

export const gettAllSchema = z.object({
  page: z.number().default(1),
  limit: z.number().default(10),
  search: z.string().trim().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  package_name: z.string().trim().optional()
});

export type GettAllInput = z.infer<typeof gettAllSchema>;
