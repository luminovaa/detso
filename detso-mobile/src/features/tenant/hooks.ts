import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantService } from './service';
import { CreateTenantInput, GetAllTenantInput, UpdateTenantInput } from './schema';
import { eventBus, EVENTS } from '@/src/lib/event-bus';
import { showToast } from '@/src/components/global/toast';
import { showErrorToast } from '@/src/lib/api-error';

// ─── Query Keys ──────────────────────────────────────────────────
export const tenantKeys = {
  all: ['tenants'] as const,
  lists: () => [...tenantKeys.all, 'list'] as const,
  list: (params?: GetAllTenantInput) => [...tenantKeys.lists(), params] as const,
  details: () => [...tenantKeys.all, 'detail'] as const,
  detail: (id: string) => [...tenantKeys.details(), id] as const,
};

// ─── Queries ─────────────────────────────────────────────────────

/** Fetch paginated tenant list (SAAS Super Admin). */
export function useTenants(params?: GetAllTenantInput) {
  return useQuery({
    queryKey: tenantKeys.list(params),
    queryFn: () => tenantService.getAll(params),
  });
}

/** Fetch a single tenant by ID. */
export function useTenant(id: string) {
  return useQuery({
    queryKey: tenantKeys.detail(id),
    queryFn: () => tenantService.getById(id),
    enabled: !!id,
  });
}

// ─── Mutations ───────────────────────────────────────────────────

/** Create a new tenant (supports FormData for logo). */
export function useCreateTenant() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTenantInput | FormData) => tenantService.create(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: tenantKeys.lists() });
      eventBus.emit(EVENTS.TENANT.CREATED, { tenantId: res?.data?.id ?? '' });
      eventBus.emit(EVENTS.DASHBOARD.REFRESH, { reason: 'tenant_created' });
      showToast.success('Berhasil', 'Tenant berhasil ditambahkan');
    },
    onError: (error) => {
      showErrorToast(error, 'Gagal menambahkan tenant');
    },
  });
}

/** Update an existing tenant (supports FormData for logo). */
export function useUpdateTenant() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTenantInput | FormData }) =>
      tenantService.update(id, data),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: tenantKeys.detail(id) });
      qc.invalidateQueries({ queryKey: tenantKeys.lists() });
      eventBus.emit(EVENTS.TENANT.UPDATED, { tenantId: id });
      showToast.success('Berhasil', 'Tenant berhasil diupdate');
    },
    onError: (error) => {
      showErrorToast(error, 'Gagal mengupdate tenant');
    },
  });
}

/** Delete a tenant. */
export function useDeleteTenant() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tenantService.delete(id),
    onSuccess: (_res, id) => {
      qc.removeQueries({ queryKey: tenantKeys.detail(id) });
      qc.invalidateQueries({ queryKey: tenantKeys.lists() });
      eventBus.emit(EVENTS.TENANT.DELETED, { tenantId: id });
      eventBus.emit(EVENTS.DASHBOARD.REFRESH, { reason: 'tenant_deleted' });
      showToast.success('Berhasil', 'Tenant berhasil dihapus');
    },
    onError: (error) => {
      showErrorToast(error, 'Gagal menghapus tenant');
    },
  });
}
