import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from './service';
import { GetAllUserInput, UpdatePasswordInput, UpdateUserInput } from './schema';
import { authService } from '@/src/features/auth/service';
import { CreateUserInput } from '@/src/features/auth/schema';
import { eventBus, EVENTS } from '@/src/lib/event-bus';
import { showToast } from '@/src/components/global/toast';
import { showErrorToast } from '@/src/lib/api-error';

// ─── Query Keys ──────────────────────────────────────────────────
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (params?: GetAllUserInput) => [...userKeys.lists(), params] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

// ─── Queries ─────────────────────────────────────────────────────

/** Fetch paginated user list with optional role filter. */
export function useUsers(params?: GetAllUserInput) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => userService.getAll(params),
  });
}

/** Fetch infinite scrollable user list. */
export function useInfiniteUsers(params?: Omit<GetAllUserInput, 'page'>) {
  return useInfiniteQuery({
    queryKey: [...userKeys.lists(), 'infinite', params],
    queryFn: ({ pageParam }: { pageParam: number }) =>
      userService.getAll({ ...params, page: pageParam, limit: params?.limit ?? 10 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: any) => {
      const pagination = lastPage?.data?.pagination;
      return pagination?.hasNextPage ? pagination.currentPage + 1 : undefined;
    },
  });
}

/** Fetch a single user by ID. */
export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => userService.getById(id),
    enabled: !!id,
  });
}

// ─── Mutations ───────────────────────────────────────────────────

/** Update user info (supports FormData for avatar). */
export function useUpdateUser() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserInput | FormData }) =>
      userService.update(id, data),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: userKeys.detail(id) });
      qc.invalidateQueries({ queryKey: userKeys.lists() });
      eventBus.emit(EVENTS.USER.UPDATED, { userId: id });
      showToast.success('Berhasil', 'User berhasil diupdate');
    },
    onError: (error) => {
      showErrorToast(error, 'Gagal mengupdate user');
    },
  });
}

/** Change current user's password. */
export function useUpdatePassword() {
  return useMutation({
    mutationFn: (data: UpdatePasswordInput) => userService.updatePassword(data),
    onSuccess: () => {
      eventBus.emit(EVENTS.USER.PASSWORD_CHANGED);
      showToast.success('Berhasil', 'Password berhasil diubah');
    },
    onError: (error) => {
      showErrorToast(error, 'Gagal mengubah password');
    },
  });
}

/** Create a new user (team member). */
export function useCreateUser() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserInput) => authService.register(data as any),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: userKeys.lists() });
      eventBus.emit(EVENTS.USER.CREATED, { userId: res?.data?.id ?? '' });
      showToast.success('Berhasil', 'Anggota tim berhasil ditambahkan');
    },
    onError: (error) => {
      showErrorToast(error, 'Gagal menambahkan anggota tim');
    },
  });
}

/** Delete a user. */
export function useDeleteUser() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => userService.delete(id),
    onSuccess: (_res, id) => {
      qc.removeQueries({ queryKey: userKeys.detail(id) });
      qc.invalidateQueries({ queryKey: userKeys.lists() });
      eventBus.emit(EVENTS.USER.DELETED, { userId: id });
      showToast.success('Berhasil', 'User berhasil dihapus');
    },
    onError: (error) => {
      showErrorToast(error, 'Gagal menghapus user');
    },
  });
}
