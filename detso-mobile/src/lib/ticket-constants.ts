import { BadgeVariantKey } from './badge-variants';
import { TicketStatus, TicketPriority } from './types';

/**
 * Shared ticket status → badge variant mapping.
 * Single source of truth untuk ticket-item.tsx dan recent-ticket-item.tsx.
 */
export const TICKET_STATUS_VARIANTS: Record<TicketStatus, BadgeVariantKey> = {
  OPEN: 'info',
  IN_PROGRESS: 'warning',
  RESOLVED: 'success',
  CLOSED: 'neutral',
};

/**
 * Shared ticket priority → badge variant mapping.
 */
export const TICKET_PRIORITY_VARIANTS: Record<TicketPriority, BadgeVariantKey> = {
  LOW: 'neutral',
  MEDIUM: 'info',
  HIGH: 'warning',
  URGENT: 'error',
};

/**
 * Shared ticket priority → color mapping for icons/indicators.
 * Uses semantic colors that adapt to theme.
 * - LOW: Muted gray
 * - MEDIUM: Primary brand color (teal)
 * - HIGH: Amber warning
 * - URGENT: Red error
 */
export const TICKET_PRIORITY_COLORS: Record<TicketPriority, string> = {
  LOW: '#64748B',
  MEDIUM: '#0F766E', // Now teal!
  HIGH: '#f59e0b', // amber-500
  URGENT: '#ef4444', // red-500
};
