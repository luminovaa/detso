import { z } from 'zod';

const photoSchema = z.object({
    type: z.string().min(1, 'Tipe foto harus diisi'),
    notes: z.string().optional()
});

export const createServiceConnectionSchema = z.object({
    customer_id: z.string().min(1, 'Customer ID harus diisi'),
    package_id: z.string().min(1, 'Package ID harus diisi'),
    address: z.string().min(1, 'Alamat harus diisi'),
    package_name: z.string().min(1, 'Nama paket harus diisi'),
    package_speed: z.string().min(1, 'Kecepatan paket harus diisi'),
    ip_address: z.string().ip().optional().or(z.literal('')),
    mac_address: z.string().regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, {
        message: 'Format MAC address tidak valid'
    }).optional().or(z.literal('')),
    notes: z.string().optional(),
    photos: z.array(photoSchema).optional()
});

export const updateServiceConnectionSchema = z.object({
  package_id: z.string().min(1, 'Package ID harus diisi').optional(),
  address: z.string().min(1, 'Alamat harus diisi').optional(),
  package_name: z.string().min(1, 'Nama paket harus diisi').optional(),
  package_speed: z.string().min(1, 'Kecepatan paket harus diisi').optional(),
  ip_address: z.string().ip().optional().or(z.literal('')),
  mac_address: z.string()
    .regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, {
      message: 'Format MAC address tidak valid'
    })
    .optional()
    .or(z.literal('')),
  notes: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  photos: z.array(photoSchema).optional()
});