import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { networkService } from './service';
import { CreateNodeInput, EditNodeInput, CreateLinkInput, EditLinkInput } from './types';
import { showToast } from '@/src/components/global/toast';
import { showErrorToast } from '@/src/lib/api-error';
import { useT } from '@/src/features/i18n/store';

// ─── Query Keys ──────────────────────────────────────────────────

export const networkKeys = {
  all: ['network'] as const,
  topology: () => [...networkKeys.all, 'topology'] as const,
  nodes: () => [...networkKeys.all, 'nodes'] as const,
  node: (id: string) => [...networkKeys.nodes(), id] as const,
  links: () => [...networkKeys.all, 'links'] as const,
};

// ─── Queries ─────────────────────────────────────────────────────

/** Fetch full network topology (nodes + links + services). */
export function useNetworkTopology() {
  return useQuery({
    queryKey: networkKeys.topology(),
    queryFn: () => networkService.getTopology(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    refetchOnWindowFocus: false,
  });
}

/** Fetch nodes list with optional type filter. */
export function useNetworkNodes(type?: 'SERVER' | 'ODP') {
  return useQuery({
    queryKey: [...networkKeys.nodes(), type],
    queryFn: () => networkService.getNodes({ type }),
  });
}

/** Fetch single node detail. */
export function useNetworkNode(id: string) {
  return useQuery({
    queryKey: networkKeys.node(id),
    queryFn: () => networkService.getNodeById(id),
    enabled: !!id,
  });
}

// ─── Mutations ───────────────────────────────────────────────────

/** Create a new network node (Server/ODP). */
export function useCreateNode() {
  const qc = useQueryClient();
  const { t } = useT();

  return useMutation({
    mutationFn: (data: CreateNodeInput) => networkService.createNode(data),
    onSuccess: (_res, variables) => {
      qc.invalidateQueries({ queryKey: networkKeys.topology() });
      qc.invalidateQueries({ queryKey: networkKeys.nodes() });
      showToast.success(t('common.success'), t('network.nodeCreateSuccess'));
    },
    onError: (error) => {
      showErrorToast(error, t('network.nodeCreateFailed'));
    },
  });
}

/** Update an existing network node. */
export function useEditNode() {
  const qc = useQueryClient();
  const { t } = useT();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EditNodeInput }) =>
      networkService.editNode(id, data),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: networkKeys.topology() });
      qc.invalidateQueries({ queryKey: networkKeys.node(id) });
      showToast.success(t('common.success'), t('network.nodeUpdateSuccess'));
    },
    onError: (error) => {
      showErrorToast(error, t('network.nodeUpdateFailed'));
    },
  });
}

/** Delete a network node. */
export function useDeleteNode() {
  const qc = useQueryClient();
  const { t } = useT();

  return useMutation({
    mutationFn: (id: string) => networkService.deleteNode(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: networkKeys.topology() });
      qc.invalidateQueries({ queryKey: networkKeys.nodes() });
      showToast.success(t('common.success'), t('network.nodeDeleteSuccess'));
    },
    onError: (error) => {
      showErrorToast(error, t('network.nodeDeleteFailed'));
    },
  });
}

/** Create a link between nodes or node-to-service. */
export function useCreateLink() {
  const qc = useQueryClient();
  const { t } = useT();

  return useMutation({
    mutationFn: (data: CreateLinkInput) => networkService.createLink(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: networkKeys.topology() });
      showToast.success(t('common.success'), t('network.linkCreateSuccess'));
    },
    onError: (error) => {
      showErrorToast(error, t('network.linkCreateFailed'));
    },
  });
}

/** Update a link (waypoints, notes, type). */
export function useEditLink() {
  const qc = useQueryClient();
  const { t } = useT();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EditLinkInput }) =>
      networkService.editLink(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: networkKeys.topology() });
      showToast.success(t('common.success'), t('network.linkUpdateSuccess'));
    },
    onError: (error) => {
      showErrorToast(error, t('network.linkUpdateFailed'));
    },
  });
}

/** Delete a link. */
export function useDeleteLink() {
  const qc = useQueryClient();
  const { t } = useT();

  return useMutation({
    mutationFn: (id: string) => networkService.deleteLink(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: networkKeys.topology() });
      showToast.success(t('common.success'), t('network.linkDeleteSuccess'));
    },
    onError: (error) => {
      showErrorToast(error, t('network.linkDeleteFailed'));
    },
  });
}
