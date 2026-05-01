import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { packageService } from './service';
import { CreatePackageInput, GetAllPackageInput, UpdatePackageInput } from './schema';
import { eventBus, EVENTS } from '@/src/lib/event-bus';
import { showToast } from '@/src/components/global/toast';
import { showErrorToast } from '@/src/lib/api-error';
import { useT } from '@/src/features/i18n/store';

// ─── Query Keys ──────────────────────────────────────────────────
export const packageKeys = {
  all: ['packages'] as const,
  lists: () => [...packageKeys.all, 'list'] as const,
  list: (params?: GetAllPackageInput) => [...packageKeys.lists(), params] as const,
  details: () => [...packageKeys.all, 'detail'] as const,
  detail: (id: string) => [...packageKeys.details(), id] as const,
};

// ─── Queries ─────────────────────────────────────────────────────

/** Fetch paginated package list. */
export function usePackages(params?: GetAllPackageInput) {
  return useQuery({
    queryKey: packageKeys.list(params),
    queryFn: () => packageService.getAll(params),
  });
}

/** Fetch infinite scrollable package list. */
export function useInfinitePackages(params?: Omit<GetAllPackageInput, 'page'>) {
  return useInfiniteQuery({
    queryKey: [...packageKeys.lists(), 'infinite', params],
    queryFn: ({ pageParam }: { pageParam: number }) =>
      packageService.getAll({ ...params, page: pageParam, limit: params?.limit ?? 10 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: any) => {
      const pagination = lastPage?.data?.pagination;
      return pagination?.hasNextPage ? pagination.currentPage + 1 : undefined;
    },
  });
}

/** Fetch a single package by ID. */
export function usePackage(id: string) {
  return useQuery({
    queryKey: packageKeys.detail(id),
    queryFn: () => packageService.getById(id),
    enabled: !!id,
  });
}

// ─── Mutations ───────────────────────────────────────────────────

/** Create a new package. */
export function useCreatePackage() {
  const qc = useQueryClient();
  const { t } = useT();

  return useMutation({
    mutationFn: (data: CreatePackageInput) => packageService.create(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: packageKeys.lists() });
      eventBus.emit(EVENTS.PACKAGE.CREATED, { packageId: res?.data?.id ?? '' });
      showToast.success(t('common.success'), t('package.successCreate'));
    },
    onError: (error) => {
      showErrorToast(error, t('package.createFailed'));
    },
  });
}

/** Update an existing package. */
export function useUpdatePackage() {
  const qc = useQueryClient();
  const { t } = useT();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePackageInput }) =>
      packageService.update(id, data),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: packageKeys.detail(id) });
      qc.invalidateQueries({ queryKey: packageKeys.lists() });
      eventBus.emit(EVENTS.PACKAGE.UPDATED, { packageId: id });
      showToast.success(t('common.success'), t('package.successUpdate'));
    },
    onError: (error) => {
      showErrorToast(error, t('package.updateFailed'));
    },
  });
}

/** Delete a package. */
export function useDeletePackage() {
  const qc = useQueryClient();
  const { t } = useT();

  return useMutation({
    mutationFn: (id: string) => packageService.delete(id),
    onSuccess: (_res, id) => {
      qc.removeQueries({ queryKey: packageKeys.detail(id) });
      qc.invalidateQueries({ queryKey: packageKeys.lists() });
      eventBus.emit(EVENTS.PACKAGE.DELETED, { packageId: id });
      showToast.success(t('common.success'), t('package.successDelete'));
    },
    onError: (error) => {
      showErrorToast(error, t('package.deleteFailed'));
    },
  });
}
