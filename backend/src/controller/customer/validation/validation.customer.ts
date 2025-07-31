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
    .optional()
    .refine(val => val !== '', { message: 'Nama tidak boleh kosong' }),

  phone: z
    .string()
    .min(1, { message: 'Nomor telepon wajib diisi' })
    .regex(/^[\d+][\d\s\-()]{6,15}$/, { message: 'Nomor telepon tidak valid' })
    .optional(),

  email: z
    .string()
    .email({ message: 'Email tidak valid' })
    .optional()
    .nullable()
    .transform(val => val === '' ? null : val), // string kosong → null

  nik: z
    .string()
    .length(16, { message: 'NIK harus tepat 16 digit' })
    .regex(/^\d{16}$/, { message: 'NIK hanya boleh angka' })
    .optional(),

  // documents dikirim sebagai JSON string, jadi kita terima sebagai array object
  documents: z
    .array(documentSchema)
    .max(5, { message: 'Maksimal 5 dokumen' })
    .optional()
    .default([]), // jika tidak ada, anggap kosong
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
    name: z.string().min(3, 'Nama minimal 3 karakter'),
    phone: z.string().min(10, 'Nomor telepon minimal 10 karakter').optional(),
    email: z.string().email('Email tidak valid').optional(),
    nik: z.string().min(16, 'NIK harus 16 karakter').optional(),
    package_id: z.string().min(1, 'Package ID harus diisi'),
    address: z.string().min(10, 'Alamat minimal 10 karakter'),
    package_name: z.string().min(1, 'Nama paket harus diisi'),
    package_speed: z.string().min(1, 'Kecepatan paket harus diisi'),
    ip_address: z.string().ip('Alamat IP tidak valid').optional(),
    mac_address: z.string().min(12, 'MAC address minimal 12 karakter').optional(),
    notes: z.string().optional(),
    documents: z.array(documentSchema).optional(), 
    photos: z.array(photoSchema).optional(),      
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
    .refine((val) => val > 0, { message: 'Batas harus lebih besar dari 0' })
})
