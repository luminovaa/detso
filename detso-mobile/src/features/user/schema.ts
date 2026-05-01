import { z } from 'zod';
import { useLanguageStore } from '@/src/features/i18n/store';

// Helper to get translation outside React components
const t = (key: string) => {
  const { locale, i18n } = useLanguageStore.getState();
  return i18n.t(key, { locale });
};

const TENANT_ROLES = ['TENANT_OWNER', 'TENANT_ADMIN', 'TENANT_TEKNISI'] as const;

export const getAllUserSchema = z.object({
  page: z.number().default(1),
  limit: z.number().default(10),
  search: z.string().trim().optional(),
  role: z.enum(TENANT_ROLES).optional(),
});

export type GetAllUserInput = z.infer<typeof getAllUserSchema>;

export const updateUserSchema = z.object({
  email: z.string().email(t('validation.emailInvalid')).optional().or(z.literal('')),
  username: z.string().min(3, t('validation.usernameMin3')).optional().or(z.literal('')),
  role: z.enum(TENANT_ROLES).optional(),
  full_name: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const updatePasswordSchema = z
  .object({
    oldPassword: z.string().min(6, t('validation.passwordOldRequired')),
    password: z.string().min(6, t('validation.passwordNewMin')),
    confirmPassword: z.string().min(6, t('validation.passwordConfirmRequired')),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: t('validation.passwordMismatch'),
    path: ['confirmPassword'],
  });

export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
