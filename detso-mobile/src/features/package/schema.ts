import { z } from 'zod';
import { useLanguageStore } from '@/src/features/i18n/store';
import { basePaginationSchema } from '@/src/lib/base-schemas';

const t = (key: string) => {
  const { locale, i18n } = useLanguageStore.getState();
  return i18n.t(key, { locale });
};

export const getAllPackageSchema = basePaginationSchema;

export type GetAllPackageInput = z.infer<typeof getAllPackageSchema>;

export const createPackageSchema = z.object({
  name: z.string().min(3, t('validation.packageNameMin3')),
  speed: z.string().min(1, t('validation.packageSpeedRequired')),
  price: z.coerce.number().nonnegative(t('validation.priceNonNegative')).optional(),
});

export type CreatePackageInput = z.infer<typeof createPackageSchema>;

export const updatePackageSchema = z.object({
  name: z.string().min(3, t('validation.packageNameMin3')).optional().or(z.literal('')),
  speed: z.string().min(1, t('validation.packageSpeedRequired')).optional().or(z.literal('')),
  price: z.coerce.number().nonnegative(t('validation.priceNonNegative')).optional(),
});

export type UpdatePackageInput = z.infer<typeof updatePackageSchema>;

export const packageIdSchema = z.object({
  id: z.string().min(1, t('validation.idInvalid')),
});

export type PackageIdInput = z.infer<typeof packageIdSchema>;