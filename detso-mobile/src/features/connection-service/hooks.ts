import { useMutation, useQueryClient, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { connectionService } from './service';
import { UpdateServiceConnectionInput } from './schema';
import { customerKeys } from '../customer/hooks';
import { eventBus, EVENTS } from '@/src/lib/event-bus';
import { showToast } from '@/src/components/global/toast';
import { showErrorToast } from '@/src/lib/api-error';
import { useT } from '@/src/features/i18n/store';

// ─── Query Keys ──────────────────────────────────────────────────
export const serviceKeys = {
  all: ['services'] as const,
  lists: () => [...serviceKeys.all, 'list'] as const,
  list: (params: Record<string, any>) => [...serviceKeys.lists(), params] as const,
  details: () => [...serviceKeys.all, 'detail'] as const,
  detail: (id: string) => [...serviceKeys.details(), id] as const,
};

// ─── Queries ─────────────────────────────────────────────────────

interface UseInfiniteServicesParams {
  limit?: number;
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

/** Infinite query for paginated service list */
export function useInfiniteServices(params: UseInfiniteServicesParams = {}) {
  return useInfiniteQuery({
    queryKey: serviceKeys.list(params),
    queryFn: ({ pageParam = 1 }) =>
      connectionService.getAll({
        page: pageParam,
        limit: params.limit || 20,
        search: params.search,
        status: params.status,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: any) => {
      const pagination = lastPage?.data?.pagination;
      if (pagination?.hasNextPage) {
        return pagination.currentPage + 1;
      }
      return undefined;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/** Get a single service connection by ID */
export function useService(id: string) {
  return useQuery({
    queryKey: serviceKeys.detail(id),
    queryFn: () => connectionService.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Mutations ───────────────────────────────────────────────────

/** Create a new service connection (FormData with photos). */
export function useCreateServiceConnection() {
  const qc = useQueryClient();
  const { t } = useT();

  return useMutation({
    mutationFn: (data: FormData) => connectionService.create(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: serviceKeys.lists() });
      // Also refresh customer detail since service count changes
      qc.invalidateQueries({ queryKey: customerKeys.lists() });
      eventBus.emit(EVENTS.SERVICE.CREATED, { serviceId: res?.data?.id ?? '' });
      eventBus.emit(EVENTS.DASHBOARD.REFRESH, { reason: 'service_created' });
      showToast.success(t('common.success'), t('service.createSuccess'));
    },
    onError: (error) => {
      showErrorToast(error, t('service.createFailed'));
    },
  });
}

/** Update an existing service connection. */
export function useUpdateServiceConnection() {
  const qc = useQueryClient();
  const { t } = useT();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateServiceConnectionInput | FormData }) =>
      connectionService.update(id, data),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: serviceKeys.detail(id) });
      qc.invalidateQueries({ queryKey: serviceKeys.lists() });
      qc.invalidateQueries({ queryKey: customerKeys.lists() });
      eventBus.emit(EVENTS.SERVICE.UPDATED, { serviceId: id });
      showToast.success(t('common.success'), t('service.updateSuccess'));
    },
    onError: (error) => {
      showErrorToast(error, t('service.updateFailed'));
    },
  });
}

/** Delete a service connection. */
export function useDeleteServiceConnection() {
  const qc = useQueryClient();
  const { t } = useT();

  return useMutation({
    mutationFn: (id: string) => connectionService.delete(id),
    onSuccess: (_res, id) => {
      qc.removeQueries({ queryKey: serviceKeys.detail(id) });
      qc.invalidateQueries({ queryKey: serviceKeys.lists() });
      qc.invalidateQueries({ queryKey: customerKeys.lists() });
      eventBus.emit(EVENTS.SERVICE.DELETED, { serviceId: id });
      eventBus.emit(EVENTS.DASHBOARD.REFRESH, { reason: 'service_deleted' });
      showToast.success(t('common.success'), t('service.deleteSuccess'));
    },
    onError: (error) => {
      showErrorToast(error, t('service.deleteFailed'));
    },
  });
}
