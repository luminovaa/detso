import { QueryClient } from '@tanstack/react-query';

/**
 * Shared React Query client instance.
 *
 * Default options:
 * - staleTime: 5 min  → data dianggap fresh selama 5 menit (tidak refetch)
 * - gcTime: 10 min    → cache disimpan 10 menit setelah tidak dipakai
 * - retry: 2          → retry 2x jika gagal
 * - refetchOnWindowFocus: false → tidak auto-refetch saat app kembali ke foreground
 *   (kita handle manual via AppState + event bus)
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});
