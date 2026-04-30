import { useQuery } from '@tanstack/react-query';
import { dashboardService } from './service';

// ─── Query Keys ──────────────────────────────────────────────────
export const dashboardKeys = {
  all: ['dashboard'] as const,
  saas: () => [...dashboardKeys.all, 'saas'] as const,
  tenant: () => [...dashboardKeys.all, 'tenant'] as const,
};

// ─── Queries ─────────────────────────────────────────────────────

/** Fetch SAAS Super Admin dashboard metrics. */
export function useSaasDashboard() {
  return useQuery({
    queryKey: dashboardKeys.saas(),
    queryFn: () => dashboardService.getSaasData(),
    staleTime: 2 * 60 * 1000, // 2 min — dashboards should feel fresh
  });
}

/** Fetch Tenant Owner/Admin dashboard metrics. */
export function useTenantDashboard() {
  return useQuery({
    queryKey: dashboardKeys.tenant(),
    queryFn: () => dashboardService.getTenantData(),
    staleTime: 2 * 60 * 1000,
  });
}
