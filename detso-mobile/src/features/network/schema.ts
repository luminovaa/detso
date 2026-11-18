import { z } from 'zod';
import { translateSchema } from '@/src/features/i18n/store';

export const createOdpSchema = (locale?: 'en' | 'id') =>
  z.object({
    name: z.string().trim().min(1, translateSchema('odp.nameRequired', locale)),
    address: z.string().optional(),
    slot: z.string().optional(),
    parent_id: z.string().optional().or(z.literal('')),
    notes: z.string().optional(),
  });

export type OdpFormValues = z.infer<ReturnType<typeof createOdpSchema>>;
