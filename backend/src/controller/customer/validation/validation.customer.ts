import { z } from 'zod';

const documentSchema = z.object({
  type: z.string().min(1, { message: 'Jenis dokumen wajib diisi' }),
  id: z.string().optional(),
});

// Schema utama untuk update customer
export const updateCustomerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: 'Nama wajib diisi' })
    .max(100, { message: 'Nama maksimal 100 karakter' })
    .optional(),

  phone: z
    .string()
    .optional()
    .nullable()
    .or(z.literal('')),

  email: z
    .string()
    .email({ message: 'Email tidak valid' })
    .optional()
    .nullable()
    .or(z.literal(''))
    .transform((val) => (val === '' ? null : val)), // string kosong → null
  birth_date: z.preprocess((arg) => {
    if (!arg || arg === '') return undefined;
    const date = new Date(String(arg));
    return isNaN(date.getTime()) ? undefined : date;
  }, z.date().optional()).optional(),
  birth_place: z.string().optional().nullable(),
  nik: z
    .string()
    .length(16, { message: 'NIK harus tepat 16 digit' })
    .regex(/^\d{16}$/, { message: 'NIK hanya boleh angka' })
    .optional()
    .nullable()
    .or(z.literal('')),

  // documents dikirim sebagai JSON string, jadi kita terima sebagai array object
  documents: z
    .array(documentSchema)
    .max(5, { message: 'Maksimal 5 dokumen' })
    .optional(),
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

// Schema untuk foto
const photoSchema = z.object({
  type: z.string().min(1, 'Jenis foto harus diisi'),
});

export const createCustomerSchema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi'),
  phone: z.string().optional().nullable().or(z.literal('')),
  email: z.string().email('Email tidak valid').optional().nullable().or(z.literal('')),
  nik: z.string().regex(/^\d{16}$/, 'NIK harus 16 digit angka').optional().nullable().or(z.literal('')),
  package_id: z.string().optional().nullable().or(z.literal('')),
  address_service: z.string().optional().nullable().or(z.literal('')),
  address: z.string().optional().nullable().or(z.literal('')),
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
  }, z.date().optional()).optional(),
  birth_place: z.string().optional(),
  mac_address: z.string().min(12, 'MAC address minimal 12 karakter').optional().or(z.literal('')),
  notes: z.string().optional(),
  documents: z.array(documentSchema).optional(),
  photos: z.array(photoSchema).optional(),
  odp_id: z.string().optional().or(z.literal('')),
});

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
})
