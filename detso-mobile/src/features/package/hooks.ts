import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { packageService } from './service';
import { CreatePackageInput, GetAllPackageInput, UpdatePackageInput } from './schema';
import { eventBus, EVENTS } from '@/src/lib/event-bus';
import { showToast } from '@/src/components/global/toast';
import { showErrorToast } from '@/src/lib/api-error';

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

  return useMutation({
    mutationFn: (data: CreatePackageInput) => packageService.create(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: packageKeys.lists() });
      eventBus.emit(EVENTS.PACKAGE.CREATED, { packageId: res?.data?.id ?? '' });
      showToast.success('Berhasil', 'Paket berhasil ditambahkan');
    },
    onError: (error) => {
      showErrorToast(error, 'Gagal menambahkan paket');
    },
  });
}

/** Update an existing package. */
export function useUpdatePackage() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePackageInput }) =>
      packageService.update(id, data),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: packageKeys.detail(id) });
      qc.invalidateQueries({ queryKey: packageKeys.lists() });
      eventBus.emit(EVENTS.PACKAGE.UPDATED, { packageId: id });
      showToast.success('Berhasil', 'Paket berhasil diupdate');
    },
    onError: (error) => {
      showErrorToast(error, 'Gagal mengupdate paket');
    },
  });
}

/** Delete a package. */
export function useDeletePackage() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => packageService.delete(id),
    onSuccess: (_res, id) => {
      qc.removeQueries({ queryKey: packageKeys.detail(id) });
      qc.invalidateQueries({ queryKey: packageKeys.lists() });
      eventBus.emit(EVENTS.PACKAGE.DELETED, { packageId: id });
      showToast.success('Berhasil', 'Paket berhasil dihapus');
    },
    onError: (error) => {
      showErrorToast(error, 'Gagal menghapus paket');
    },
  });
}
