import { useMutation, useQueryClient } from '@tanstack/react-query';
import { connectionService } from './service';
import { UpdateServiceConnectionInput } from './schema';
import { customerKeys } from '../customer/hooks';
import { eventBus, EVENTS } from '@/src/lib/event-bus';
import { showToast } from '@/src/components/global/toast';
import { showErrorToast } from '@/src/lib/api-error';

// ─── Query Keys ──────────────────────────────────────────────────
export const serviceKeys = {
  all: ['services'] as const,
  lists: () => [...serviceKeys.all, 'list'] as const,
  details: () => [...serviceKeys.all, 'detail'] as const,
  detail: (id: string) => [...serviceKeys.details(), id] as const,
};

// ─── Mutations ───────────────────────────────────────────────────

/** Create a new service connection (FormData with photos). */
export function useCreateServiceConnection() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: FormData) => connectionService.create(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: serviceKeys.lists() });
      // Also refresh customer detail since service count changes
      qc.invalidateQueries({ queryKey: customerKeys.lists() });
      eventBus.emit(EVENTS.SERVICE.CREATED, { serviceId: res?.data?.id ?? '' });
      eventBus.emit(EVENTS.DASHBOARD.REFRESH, { reason: 'service_created' });
      showToast.success('Berhasil', 'Koneksi layanan berhasil dibuat');
    },
    onError: (error) => {
      showErrorToast(error, 'Gagal membuat koneksi layanan');
    },
  });
}

/** Update an existing service connection. */
export function useUpdateServiceConnection() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateServiceConnectionInput | FormData }) =>
      connectionService.update(id, data),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: serviceKeys.detail(id) });
      qc.invalidateQueries({ queryKey: serviceKeys.lists() });
      qc.invalidateQueries({ queryKey: customerKeys.lists() });
      eventBus.emit(EVENTS.SERVICE.UPDATED, { serviceId: id });
      showToast.success('Berhasil', 'Koneksi layanan berhasil diupdate');
    },
    onError: (error) => {
      showErrorToast(error, 'Gagal mengupdate koneksi layanan');
    },
  });
}

/** Delete a service connection. */
export function useDeleteServiceConnection() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => connectionService.delete(id),
    onSuccess: (_res, id) => {
      qc.removeQueries({ queryKey: serviceKeys.detail(id) });
      qc.invalidateQueries({ queryKey: serviceKeys.lists() });
      qc.invalidateQueries({ queryKey: customerKeys.lists() });
      eventBus.emit(EVENTS.SERVICE.DELETED, { serviceId: id });
      eventBus.emit(EVENTS.DASHBOARD.REFRESH, { reason: 'service_deleted' });
      showToast.success('Berhasil', 'Koneksi layanan berhasil dihapus');
    },
    onError: (error) => {
      showErrorToast(error, 'Gagal menghapus koneksi layanan');
    },
  });
}
