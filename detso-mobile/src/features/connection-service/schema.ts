import { z } from 'zod';
import { translateSchema } from '@/src/features/i18n/store';

const photoSchema = z.object({
  type: z.string().min(1, translateSchema('validation.photoTypeRequired')),
  notes: z.string().optional().nullable(),
});

export const createServiceConnectionSchema = z.object({
  customer_id: z.string().min(1, translateSchema('validation.customerIdRequired')),
  package_id: z.string().min(1, translateSchema('validation.packageIdRequired')),
  address: z.string().optional().or(z.literal('')),
  package_name: z.string().min(1, translateSchema('validation.packageNameRequired')),
  package_speed: z.string().min(1, translateSchema('validation.packageSpeedRequired')),
  ip_address: z.ipv4().optional().or(z.literal('')),
  mac_address: z.string()
    .regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, {
      message: translateSchema('validation.macInvalid'),
    })
    .optional()
    .or(z.literal('')),
  lat: z.string().optional(),
  long: z.string().optional(),
  notes: z.string().optional().nullable(),
  photos: z.array(photoSchema).optional(),
  odp_id: z.string().optional().or(z.literal('')),
});

export type CreateServiceConnectionInput = z.infer<typeof createServiceConnectionSchema>;

export const updateServiceConnectionSchema = z.object({
  package_id: z.string().min(1, translateSchema('validation.packageIdRequired')).optional(),
  address: z.string().optional().or(z.literal('')),
  package_name: z.string().min(1, translateSchema('validation.packageNameRequired')).optional(),
  package_speed: z.string().min(1, translateSchema('validation.packageSpeedRequired')).optional(),
  ip_address: z.ipv4().optional().or(z.literal('')),
  mac_address: z.string()
    .regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, {
      message: translateSchema('validation.macInvalid'),
    })
    .optional()
    .or(z.literal('')),
  notes: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  photos: z.array(photoSchema).optional(),
  odp_id: z.string().optional().or(z.literal('')),
});

export type UpdateServiceConnectionInput = z.infer<typeof updateServiceConnectionSchema>;
