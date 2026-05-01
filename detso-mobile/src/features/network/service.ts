import api from '@/src/lib/api';
import {
  CreateNodeInput,
  EditNodeInput,
  CreateLinkInput,
  EditLinkInput,
} from './types';

export const networkService = {
  // ─── Topology ────────────────────────────────────────────────────
  getTopology: async () => {
    const response = await api.get('/network/topology');
    return response.data;
  },

  // ─── Nodes ───────────────────────────────────────────────────────
  getNodes: async (params?: { type?: 'SERVER' | 'ODP'; page?: number; limit?: number }) => {
    const response = await api.get('/network/nodes', { params });
    return response.data;
  },

  getNodeById: async (id: string) => {
    const response = await api.get(`/network/nodes/${id}`);
    return response.data;
  },

  createNode: async (data: CreateNodeInput) => {
    const response = await api.post('/network/nodes', data);
    return response.data;
  },

  editNode: async (id: string, data: EditNodeInput) => {
    const response = await api.put(`/network/nodes/${id}`, data);
    return response.data;
  },

  deleteNode: async (id: string) => {
    const response = await api.delete(`/network/nodes/${id}`);
    return response.data;
  },

  // ─── Links ───────────────────────────────────────────────────────
  getLinks: async () => {
    const response = await api.get('/network/links');
    return response.data;
  },

  createLink: async (data: CreateLinkInput) => {
    const response = await api.post('/network/links', data);
    return response.data;
  },

  editLink: async (id: string, data: EditLinkInput) => {
    const response = await api.put(`/network/links/${id}`, data);
    return response.data;
  },

  deleteLink: async (id: string) => {
    const response = await api.delete(`/network/links/${id}`);
    return response.data;
  },

  // ─── Unlinked Services (for connect flow) ────────────────────────
  getUnlinkedServices: async () => {
    // Get all services that don't have a network link yet
    // We'll filter client-side from topology data
    const response = await api.get('/service-connection', {
      params: { limit: 200 },
    });
    return response.data;
  },
};
