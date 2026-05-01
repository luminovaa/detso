import { z } from 'zod';
import { useLanguageStore } from '@/src/features/i18n/store';

const t = (key: string) => {
  const { locale, i18n } = useLanguageStore.getState();
  return i18n.t(key, { locale });
};

export enum Detso_Role {
  SAAS_SUPER_ADMIN = 'SAAS_SUPER_ADMIN',
  TENANT_OWNER = 'TENANT_OWNER',
  TENANT_ADMIN = 'TENANT_ADMIN',
  TENANT_TEKNISI = 'TENANT_TEKNISI',
}

export const loginSchema = z.object({
  identifier: z.string().min(3, t('validation.identifierMin3')),
  password: z.string().min(3, t('validation.passwordMin3')),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z.string().email(t('validation.emailInvalid')),
  password: z.string().min(6, t('validation.passwordNewMin')),
  phone: z.string().min(10, t('validation.phoneMin10')),
  username: z.string().min(3, t('validation.usernameMin3')),
  address: z.string().min(3, t('validation.addressMin3')),
  lat: z.string().optional().or(z.literal('')),
  long: z.string().optional().or(z.literal('')),
  full_name: z.string().min(3, t('validation.fullNameMin3')),
  company_name: z.string().min(3, t('validation.companyNameMin3')),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const createUserSchema = z.object({
  email: z.string().email(t('validation.emailInvalid')),
  username: z.string().min(3, t('validation.usernameMin3')),
  password: z.string().min(6, t('validation.passwordNewMin')),
  full_name: z.string().min(1, t('validation.fullNameRequired')),
  phone: z.string().optional().or(z.literal('')),
  // Hanya boleh pilih role level Tenant
  role: z.enum([Detso_Role.TENANT_ADMIN, Detso_Role.TENANT_TEKNISI]).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;