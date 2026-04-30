import { useQueryClient } from '@tanstack/react-query';
import { EVENTS } from '@/src/lib/event-bus';
import { useEventBus } from './use-event-bus';
import { customerKeys } from '@/src/features/customer/hooks';
import { ticketKeys } from '@/src/features/ticket/hooks';
import { dashboardKeys } from '@/src/features/dashboard/hooks';
import { packageKeys } from '@/src/features/package/hooks';
import { scheduleKeys } from '@/src/features/schedule/hooks';
import { tenantKeys } from '@/src/features/tenant/hooks';
import { userKeys } from '@/src/features/user/hooks';
import { serviceKeys } from '@/src/features/connection-service/hooks';

/**
 * Mount this once in the root layout.
 *
 * It listens to domain events and invalidates the React Query caches
 * that are affected by cross-feature side-effects.
 *
 * Examples:
 *  - Ticket created → refresh dashboard stats
 *  - Customer deleted → refresh ticket list (orphan prevention)
 *  - Service created → refresh customer detail (service count)
 */
export function useGlobalEvents() {
  const qc = useQueryClient();

  // ── Customer events ────────────────────────────────────────────
  useEventBus(EVENTS.CUSTOMER.CREATED, () => {
    qc.invalidateQueries({ queryKey: dashboardKeys.all });
  });

  useEventBus(EVENTS.CUSTOMER.DELETED, () => {
    qc.invalidateQueries({ queryKey: dashboardKeys.all });
    qc.invalidateQueries({ queryKey: ticketKeys.lists() });
  });

  // ── Ticket events ──────────────────────────────────────────────
  useEventBus(EVENTS.TICKET.CREATED, (data) => {
    qc.invalidateQueries({ queryKey: dashboardKeys.all });
    qc.invalidateQueries({ queryKey: scheduleKeys.lists() });
    if (data?.customerId) {
      qc.invalidateQueries({ queryKey: customerKeys.detail(data.customerId) });
    }
  });

  useEventBus(EVENTS.TICKET.STATUS_CHANGED, () => {
    qc.invalidateQueries({ queryKey: dashboardKeys.all });
    qc.invalidateQueries({ queryKey: scheduleKeys.lists() });
  });

  // ── Service events ─────────────────────────────────────────────
  useEventBus(EVENTS.SERVICE.CREATED, (data) => {
    qc.invalidateQueries({ queryKey: dashboardKeys.all });
    if (data?.customerId) {
      qc.invalidateQueries({ queryKey: customerKeys.detail(data.customerId) });
    }
  });

  useEventBus(EVENTS.SERVICE.DELETED, (data) => {
    qc.invalidateQueries({ queryKey: dashboardKeys.all });
    if (data?.customerId) {
      qc.invalidateQueries({ queryKey: customerKeys.detail(data.customerId) });
    }
  });

  // ── Package events ─────────────────────────────────────────────
  useEventBus(EVENTS.PACKAGE.UPDATED, () => {
    // Package name/speed/price might be denormalized in service connections
    qc.invalidateQueries({ queryKey: serviceKeys.lists() });
  });

  useEventBus(EVENTS.PACKAGE.DELETED, () => {
    qc.invalidateQueries({ queryKey: serviceKeys.lists() });
    qc.invalidateQueries({ queryKey: dashboardKeys.all });
  });

  // ── Tenant events ──────────────────────────────────────────────
  useEventBus(EVENTS.TENANT.CREATED, () => {
    qc.invalidateQueries({ queryKey: dashboardKeys.saas() });
  });

  useEventBus(EVENTS.TENANT.DELETED, () => {
    qc.invalidateQueries({ queryKey: dashboardKeys.saas() });
  });

  // ── Dashboard refresh (catch-all from mutations) ───────────────
  useEventBus(EVENTS.DASHBOARD.REFRESH, () => {
    qc.invalidateQueries({ queryKey: dashboardKeys.all });
  });

  // ── Global refresh (nuclear option) ────────────────────────────
  useEventBus(EVENTS.GLOBAL.REFRESH_ALL, () => {
    qc.invalidateQueries();
  });

  // ── Auth logout → clear all cached data ────────────────────────
  useEventBus(EVENTS.AUTH.LOGOUT, () => {
    qc.clear();
  });
}
