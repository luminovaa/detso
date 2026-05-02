import { BadgeVariantKey } from './badge-variants';

/**
 * Shared service/customer status → badge variant mapping.
 * Single source of truth untuk customer-item.tsx dan service-item.tsx.
 */
export const SERVICE_STATUS_VARIANTS: Record<string, BadgeVariantKey> = {
  ACTIVE: 'success',
  INACTIVE: 'neutral',
  SUSPENDED: 'error',
};

/**
 * Shared role → badge variant mapping.
 * Single source of truth untuk team-item.tsx.
 */
export const ROLE_BADGE_VARIANTS: Record<string, BadgeVariantKey> = {
  TENANT_OWNER: 'warning',
  TENANT_ADMIN: 'info',
  TENANT_TEKNISI: 'success',
};
