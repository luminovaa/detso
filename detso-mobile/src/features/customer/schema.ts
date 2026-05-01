import { z } from 'zod';
import { useLanguageStore } from '@/src/features/i18n/store';

// Helper to get translation outside React components
const t = (key: string) => {
  const { locale, i18n } = useLanguageStore.getState();
  return i18n.t(key, { locale });
};

const documentSchema = z.object({
  type: z.string().min(1, { message: t('validation.docTypeRequired') }),
  id: z.string().optional(),
});

// Schema utama untuk update customer
export const updateCustomerSchema = z.object({
  name: z
    .string()
    .min(1, { message: t('validation.nameRequired') })
    .max(100, { message: t('validation.nameMax100') })
    .optional(),

  phone: z
    .string()
    .min(1, { message: t('validation.phoneRequired') })
    .regex(/^[\d+][\d\s\-()]{6,15}$/, { message: t('validation.phoneInvalid') })
    .optional(),

  email: z
    .email({ message: t('validation.emailInvalid') })
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
    .length(16, { message: t('validation.nikLength') })
    .regex(/^\d{16}$/, { message: t('validation.nikOnlyNumbers') })
    .optional(),

  documents: z
    .array(documentSchema)
    .max(5, { message: t('validation.maxDocuments') })
    .optional()
    .default([]),
}).refine(data => {
  const types = data.documents?.map(d => d.type);
  const uniqueTypes = new Set(types);
  if (types && types.length !== uniqueTypes.size) {
    return false;
  }
  return true;
}, {
  message: t('validation.duplicateDocType'),
  path: ['documents']
});

export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;

// Schema untuk foto
const photoSchema = z.object({
  type: z.string().min(1, t('validation.photoTypeRequired')),
});

export const createCustomerSchema = z.object({
  name: z.string().min(3, t('validation.nameMin3')),
  phone: z.string().min(10, t('validation.phoneMin10')).optional(),
  email: z.email(t('validation.emailInvalid')).optional().or(z.literal('')),
  nik: z.string().length(16, t('validation.nikLength')).regex(/^\d+$/, t('validation.nikOnlyNumbers')).optional().or(z.literal('')),
  package_id: z.string().min(1, t('validation.packageRequired')),
  address_service: z.string().min(10, t('validation.addressServiceMin')),
  address: z.string().min(10, t('validation.addressKtpMin')),
  package_name: z.string().optional(),
  package_speed: z.string().optional(),
  package_price: z.number().optional(),
  ip_address: z.ipv4(t('validation.ipInvalid')).optional().or(z.literal('')),
  lat: z.string().optional(),
  long: z.string().optional(),
  birth_date: z.preprocess((arg) => {
    if (!arg || arg === '') return undefined;
    const date = new Date(String(arg));
    return isNaN(date.getTime()) ? undefined : date;
  }, z.date().optional()),
  birth_place: z.string().optional(),
  mac_address: z.string().min(12, t('validation.macMin12')).optional().or(z.literal('')),
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
