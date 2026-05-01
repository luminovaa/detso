import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantService } from './service';
import { CreateTenantInput, GetAllTenantInput, UpdateTenantInput } from './schema';
import { eventBus, EVENTS } from '@/src/lib/event-bus';
import { showToast } from '@/src/components/global/toast';
import { showErrorToast } from '@/src/lib/api-error';
import { useT } from '@/src/features/i18n/store';

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

/** Fetch infinite scrollable tenant list (SAAS Super Admin). */
export function useInfiniteTenants(params?: Omit<GetAllTenantInput, 'page'>) {
  return useInfiniteQuery({
    queryKey: [...tenantKeys.lists(), 'infinite', params],
    queryFn: ({ pageParam }: { pageParam: number }) =>
      tenantService.getAll({ ...params, page: pageParam, limit: params?.limit ?? 10 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: any) => {
      const pagination = lastPage?.data?.pagination;
      return pagination?.hasNextPage ? pagination.currentPage + 1 : undefined;
    },
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
  const { t } = useT();

  return useMutation({
    mutationFn: (data: CreateTenantInput | FormData) => tenantService.create(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: tenantKeys.lists() });
      eventBus.emit(EVENTS.TENANT.CREATED, { tenantId: res?.data?.id ?? '' });
      eventBus.emit(EVENTS.DASHBOARD.REFRESH, { reason: 'tenant_created' });
      showToast.success(t('common.success'), t('tenant.createSuccess'));
    },
    onError: (error) => {
      showErrorToast(error, t('tenant.createFailed'));
    },
  });
}

/** Update an existing tenant (supports FormData for logo). */
export function useUpdateTenant() {
  const qc = useQueryClient();
  const { t } = useT();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTenantInput | FormData }) =>
      tenantService.update(id, data),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: tenantKeys.detail(id) });
      qc.invalidateQueries({ queryKey: tenantKeys.lists() });
      eventBus.emit(EVENTS.TENANT.UPDATED, { tenantId: id });
      showToast.success(t('common.success'), t('tenant.updateSuccess'));
    },
    onError: (error) => {
      showErrorToast(error, t('tenant.updateFailed'));
    },
  });
}

/** Delete a tenant. */
export function useDeleteTenant() {
  const qc = useQueryClient();
  const { t } = useT();

  return useMutation({
    mutationFn: (id: string) => tenantService.delete(id),
    onSuccess: (_res, id) => {
      qc.removeQueries({ queryKey: tenantKeys.detail(id) });
      qc.invalidateQueries({ queryKey: tenantKeys.lists() });
      eventBus.emit(EVENTS.TENANT.DELETED, { tenantId: id });
      eventBus.emit(EVENTS.DASHBOARD.REFRESH, { reason: 'tenant_deleted' });
      showToast.success(t('common.success'), t('tenant.deleteSuccess'));
    },
    onError: (error) => {
      showErrorToast(error, t('tenant.deleteFailed'));
    },
  });
}
