import { z } from 'zod';
import { translateSchema } from '@/src/features/i18n/store';
import { basePaginationSchema } from '@/src/lib/base-schemas';

const documentSchema = z.object({
  type: z.string().min(1, { message: translateSchema('validation.docTypeRequired') }),
  id: z.string().optional(),
});

// Schema utama untuk update customer
export const updateCustomerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: translateSchema('validation.nameRequired') })
    .max(100, { message: translateSchema('validation.nameMax100') })
    .optional(),

  phone: z
    .string()
    .optional()
    .nullable()
    .or(z.literal('')),

  email: z
    .email({ message: translateSchema('validation.emailInvalid') })
    .optional()
    .nullable()
    .or(z.literal('')),

  birth_date: z.date().optional(),

  birth_place: z.string().optional().nullable(),

  nik: z
    .string()
    .regex(/^\d{16}$/, { message: translateSchema('validation.nikLength') })
    .optional()
    .nullable()
    .or(z.literal('')),

  documents: z
    .array(documentSchema)
    .max(5, { message: translateSchema('validation.maxDocuments') })
    .optional(),
}).refine(data => {
  const types = data.documents?.map(d => d.type);
  const uniqueTypes = new Set(types);
  if (types && types.length !== uniqueTypes.size) {
    return false;
  }
  return true;
}, {
  message: translateSchema('validation.duplicateDocType'),
  path: ['documents']
});

export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type UpdateCustomerPayload = Omit<UpdateCustomerInput, 'birth_date'> & {
  birth_date?: string;
};

// Schema untuk foto
const photoSchema = z.object({
  type: z.string().min(1, translateSchema('validation.photoTypeRequired')),
});

export const createCustomerSchema = z.object({
  name: z.string().trim().min(1, translateSchema('validation.nameRequired')),
  phone: z.string().optional().or(z.literal('')),
  email: z.email(translateSchema('validation.emailInvalid')).optional().or(z.literal('')),
  nik: z.string().regex(/^\d{16}$/, translateSchema('validation.nikLength')).optional().or(z.literal('')),
  package_id: z.string().optional().or(z.literal('')),
  address_service: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  package_name: z.string().optional(),
  package_speed: z.string().optional(),
  package_price: z.number().optional(),
  ip_address: z.ipv4(translateSchema('validation.ipInvalid')).optional().or(z.literal('')),
  lat: z.string().optional(),
  long: z.string().optional(),
  birth_date: z.date().optional(),
  birth_place: z.string().optional(),
  mac_address: z.string().min(12, translateSchema('validation.macMin12')).optional().or(z.literal('')),
  notes: z.string().optional(),
  documents: z.array(documentSchema).optional(),
  photos: z.array(photoSchema).optional(),
  odp_id: z.string().optional().or(z.literal('')),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

export const gettAllSchema = basePaginationSchema;

export type GettAllInput = z.infer<typeof gettAllSchema>;
