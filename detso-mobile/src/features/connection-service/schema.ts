import { z } from 'zod';
import { useLanguageStore } from '@/src/features/i18n/store';

// Helper to get translation outside React components
const t = (key: string) => {
  const { locale, i18n } = useLanguageStore.getState();
  return i18n.t(key, { locale });
};

const photoSchema = z.object({
  type: z.string().min(1, t('validation.photoTypeRequired')),
  notes: z.string().optional().nullable(),
});

export const createServiceConnectionSchema = z.object({
  customer_id: z.string().min(1, t('validation.customerIdRequired')),
  package_id: z.string().min(1, t('validation.packageIdRequired')),
  address: z.string().min(1, t('validation.addressRequired')),
  package_name: z.string().min(1, t('validation.packageNameRequired')),
  package_speed: z.string().min(1, t('validation.packageSpeedRequired')),
  ip_address: z.ipv4().optional().or(z.literal('')),
  mac_address: z.string()
    .regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, {
      message: t('validation.macInvalid'),
    })
    .optional()
    .or(z.literal('')),
  notes: z.string().optional().nullable(),
  photos: z.array(photoSchema).optional(),
});

export type CreateServiceConnectionInput = z.infer<typeof createServiceConnectionSchema>;

export const updateServiceConnectionSchema = z.object({
  package_id: z.string().min(1, t('validation.packageIdRequired')).optional(),
  address: z.string().min(1, t('validation.addressRequired')).optional(),
  package_name: z.string().min(1, t('validation.packageNameRequired')).optional(),
  package_speed: z.string().min(1, t('validation.packageSpeedRequired')).optional(),
  ip_address: z.ipv4().optional().or(z.literal('')),
  mac_address: z.string()
    .regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, {
      message: t('validation.macInvalid'),
    })
    .optional()
    .or(z.literal('')),
  notes: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  photos: z.array(photoSchema).optional(),
});

export type UpdateServiceConnectionInput = z.infer<typeof updateServiceConnectionSchema>;
