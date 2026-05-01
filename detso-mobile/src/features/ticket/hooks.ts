import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketService } from './service';
import { CreateTicketInput, GetAllTicketInput, UpdateTicketInput } from './schema';
import { eventBus, EVENTS } from '@/src/lib/event-bus';
import { showToast } from '@/src/components/global/toast';
import { showErrorToast } from '@/src/lib/api-error';

// ─── Query Keys ──────────────────────────────────────────────────
export const ticketKeys = {
  all: ['tickets'] as const,
  lists: () => [...ticketKeys.all, 'list'] as const,
  list: (params?: GetAllTicketInput) => [...ticketKeys.lists(), params] as const,
  details: () => [...ticketKeys.all, 'detail'] as const,
  detail: (id: string) => [...ticketKeys.details(), id] as const,
  histories: () => [...ticketKeys.all, 'history'] as const,
  history: (id: string) => [...ticketKeys.histories(), id] as const,
};

// ─── Queries ─────────────────────────────────────────────────────

/** Fetch paginated ticket list with optional filters. */
export function useTickets(params?: GetAllTicketInput) {
  return useQuery({
    queryKey: ticketKeys.list(params),
    queryFn: () => ticketService.getAll(params),
  });
}

/** Fetch infinite scrollable ticket list. */
export function useInfiniteTickets(params?: Omit<GetAllTicketInput, 'page'>) {
  return useInfiniteQuery({
    queryKey: [...ticketKeys.lists(), 'infinite', params],
    queryFn: ({ pageParam }: { pageParam: number }) =>
      ticketService.getAll({ ...params, page: pageParam, limit: params?.limit ?? 10 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: any) => {
      const pagination = lastPage?.data?.pagination;
      return pagination?.hasNextPage ? pagination.currentPage + 1 : undefined;
    },
  });
}

/** Fetch a single ticket by ID. */
export function useTicket(id: string) {
  return useQuery({
    queryKey: ticketKeys.detail(id),
    queryFn: () => ticketService.getById(id),
    enabled: !!id,
  });
}

/** Fetch ticket history logs. */
export function useTicketHistory(id: string) {
  return useQuery({
    queryKey: ticketKeys.history(id),
    queryFn: () => ticketService.getHistory(id),
    enabled: !!id,
  });
}

// ─── Mutations ───────────────────────────────────────────────────

/** Create a new ticket. */
export function useCreateTicket() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTicketInput) => ticketService.create(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ticketKeys.lists() });
      eventBus.emit(EVENTS.TICKET.CREATED, { ticketId: res?.data?.id ?? '' });
      eventBus.emit(EVENTS.DASHBOARD.REFRESH, { reason: 'ticket_created' });
      showToast.success('Berhasil', 'Ticket berhasil dibuat');
    },
    onError: (error) => {
      showErrorToast(error, 'Gagal membuat ticket');
    },
  });
}

/** Update ticket details (supports FormData for image). */
export function useUpdateTicket() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTicketInput | FormData }) =>
      ticketService.update(id, data),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: ticketKeys.detail(id) });
      qc.invalidateQueries({ queryKey: ticketKeys.lists() });
      qc.invalidateQueries({ queryKey: ticketKeys.history(id) });
      eventBus.emit(EVENTS.TICKET.UPDATED, { ticketId: id });
      showToast.success('Berhasil', 'Ticket berhasil diupdate');
    },
    onError: (error) => {
      showErrorToast(error, 'Gagal mengupdate ticket');
    },
  });
}

/** Update ticket status (with optional image via FormData). */
export function useUpdateTicketStatus() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      ticketService.updateStatus(id, formData),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: ticketKeys.detail(id) });
      qc.invalidateQueries({ queryKey: ticketKeys.lists() });
      qc.invalidateQueries({ queryKey: ticketKeys.history(id) });
      eventBus.emit(EVENTS.TICKET.STATUS_CHANGED, { ticketId: id, status: 'updated' });
      eventBus.emit(EVENTS.DASHBOARD.REFRESH, { reason: 'ticket_status_changed' });
      showToast.success('Berhasil', 'Status ticket berhasil diubah');
    },
    onError: (error) => {
      showErrorToast(error, 'Gagal mengubah status ticket');
    },
  });
}

/** Delete a ticket. */
export function useDeleteTicket() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ticketService.delete(id),
    onSuccess: (_res, id) => {
      qc.removeQueries({ queryKey: ticketKeys.detail(id) });
      qc.invalidateQueries({ queryKey: ticketKeys.lists() });
      eventBus.emit(EVENTS.TICKET.DELETED, { ticketId: id });
      eventBus.emit(EVENTS.DASHBOARD.REFRESH, { reason: 'ticket_deleted' });
      showToast.success('Berhasil', 'Ticket berhasil dihapus');
    },
    onError: (error) => {
      showErrorToast(error, 'Gagal menghapus ticket');
    },
  });
}
