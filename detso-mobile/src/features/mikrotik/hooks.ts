import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mikrotikService } from './service';
import { CreateRouterInput, UpdateRouterInput } from './schema';
import { showToast } from '@/src/components/global/toast';

export const mikrotikKeys = {
  all: ['mikrotik'] as const,
  routers: () => [...mikrotikKeys.all, 'routers'] as const,
  router: (id: string) => [...mikrotikKeys.all, 'router', id] as const,
  monitoring: (routerId: string) => [...mikrotikKeys.all, 'monitoring', routerId] as const,
  history: (routerId: string, hours: number) => [...mikrotikKeys.all, 'history', routerId, hours] as const,
  interfaces: (routerId: string) => [...mikrotikKeys.all, 'interfaces', routerId] as const,
};

// ==========================================
// ROUTER HOOKS
// ==========================================

export function useRouters() {
  return useQuery({
    queryKey: mikrotikKeys.routers(),
    queryFn: mikrotikService.getRouters,
  });
}

export function useRouterById(id: string) {
  return useQuery({
    queryKey: mikrotikKeys.router(id),
    queryFn: () => mikrotikService.getRouterById(id),
    enabled: !!id,
  });
}

export function useCreateRouter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: mikrotikService.createRouter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mikrotikKeys.routers() });
      showToast.success('Berhasil', 'Router berhasil ditambahkan');
    },
  });
}

export function useUpdateRouter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRouterInput }) =>
      mikrotikService.updateRouter(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mikrotikKeys.routers() });
      showToast.success('Berhasil', 'Router berhasil diupdate');
    },
  });
}

export function useDeleteRouter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: mikrotikService.deleteRouter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mikrotikKeys.routers() });
      showToast.success('Berhasil', 'Router berhasil dihapus');
    },
  });
}

export function useTestConnection() {
  return useMutation({
    mutationFn: mikrotikService.testConnection,
  });
}

// ==========================================
// MONITORING HOOKS
// ==========================================

export function useCurrentMonitoring(routerId: string) {
  return useQuery({
    queryKey: mikrotikKeys.monitoring(routerId),
    queryFn: () => mikrotikService.getCurrentMonitoring(routerId),
    enabled: !!routerId,
    refetchInterval: 15000, // Refetch every 15 seconds
  });
}

export function useHistoricalData(routerId: string, hours: number = 24) {
  return useQuery({
    queryKey: mikrotikKeys.history(routerId, hours),
    queryFn: () => mikrotikService.getHistoricalData(routerId, hours),
    enabled: !!routerId,
  });
}

export function useInterfaceStats(routerId: string) {
  return useQuery({
    queryKey: mikrotikKeys.interfaces(routerId),
    queryFn: () => mikrotikService.getInterfaceStats(routerId),
    enabled: !!routerId,
    refetchInterval: 15000,
  });
}

export function useForcePoll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: mikrotikService.forcePoll,
    onSuccess: (_, routerId) => {
      queryClient.invalidateQueries({ queryKey: mikrotikKeys.monitoring(routerId) });
      queryClient.invalidateQueries({ queryKey: mikrotikKeys.interfaces(routerId) });
      showToast.success('Berhasil', 'Data berhasil di-refresh');
    },
  });
}
