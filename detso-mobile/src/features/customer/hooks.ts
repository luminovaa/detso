import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService } from './service';
import { CreateCustomerInput, GettAllInput, UpdateCustomerInput } from './schema';
import { eventBus, EVENTS } from '@/src/lib/event-bus';
import { showToast } from '@/src/components/global/toast';
import { showErrorToast } from '@/src/lib/api-error';

// ─── Query Keys ──────────────────────────────────────────────────
export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (params?: GettAllInput) => [...customerKeys.lists(), params] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
};

// ─── Queries ─────────────────────────────────────────────────────

/** Fetch paginated customer list with optional filters. */
export function useCustomers(params?: GettAllInput) {
  return useQuery({
    queryKey: customerKeys.list(params),
    queryFn: () => customerService.getAll(params),
  });
}

/** Fetch a single customer by ID. */
export function useCustomer(id: string) {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: () => customerService.getById(id),
    enabled: !!id,
  });
}

// ─── Mutations ───────────────────────────────────────────────────

/** Create a new customer. Invalidates list cache & emits event on success. */
export function useCreateCustomer() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCustomerInput) => customerService.create(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: customerKeys.lists() });
      eventBus.emit(EVENTS.CUSTOMER.CREATED, { customerId: res?.data?.id ?? '' });
      showToast.success('Berhasil', 'Customer berhasil ditambahkan');
    },
    onError: (error) => {
      showErrorToast(error, 'Gagal menambahkan customer');
    },
  });
}

/** Update an existing customer. Invalidates detail + list cache. */
export function useUpdateCustomer() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCustomerInput }) =>
      customerService.update(id, data),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: customerKeys.detail(id) });
      qc.invalidateQueries({ queryKey: customerKeys.lists() });
      eventBus.emit(EVENTS.CUSTOMER.UPDATED, { customerId: id });
      showToast.success('Berhasil', 'Customer berhasil diupdate');
    },
    onError: (error) => {
      showErrorToast(error, 'Gagal mengupdate customer');
    },
  });
}

/** Delete a customer. Removes from cache & emits event. */
export function useDeleteCustomer() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => customerService.delete(id),
    onSuccess: (_res, id) => {
      qc.removeQueries({ queryKey: customerKeys.detail(id) });
      qc.invalidateQueries({ queryKey: customerKeys.lists() });
      eventBus.emit(EVENTS.CUSTOMER.DELETED, { customerId: id });
      showToast.success('Berhasil', 'Customer berhasil dihapus');
    },
    onError: (error) => {
      showErrorToast(error, 'Gagal menghapus customer');
    },
  });
}

/** Check NIK availability. */
export function useCheckNik(nik: string) {
  return useQuery({
    queryKey: ['customer', 'check-nik', nik],
    queryFn: () => customerService.checkNik(nik),
    enabled: nik.length === 16,
  });
}
