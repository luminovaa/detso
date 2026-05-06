import api from '@/src/lib/api';
import { CreateRouterInput, UpdateRouterInput } from './schema';

export const mikrotikService = {
  // Router CRUD
  getRouters: async () => {
    const response = await api.get('/mikrotik/router');
    return response.data;
  },

  getRouterById: async (id: string) => {
    const response = await api.get(`/mikrotik/router/${id}`);
    return response.data;
  },

  createRouter: async (data: CreateRouterInput) => {
    const response = await api.post('/mikrotik/router', data);
    return response.data;
  },

  updateRouter: async (id: string, data: UpdateRouterInput) => {
    const response = await api.put(`/mikrotik/router/${id}`, data);
    return response.data;
  },

  deleteRouter: async (id: string) => {
    const response = await api.delete(`/mikrotik/router/${id}`);
    return response.data;
  },

  testConnection: async (id: string) => {
    const response = await api.post(`/mikrotik/router/${id}/test`);
    return response.data;
  },

  // Monitoring
  getCurrentMonitoring: async (routerId: string) => {
    const response = await api.get(`/mikrotik/monitoring/${routerId}/current`);
    return response.data;
  },

  getHistoricalData: async (routerId: string, hours: number = 24) => {
    const response = await api.get(`/mikrotik/monitoring/${routerId}/history`, {
      params: { hours: hours.toString() },
    });
    return response.data;
  },

  getInterfaceStats: async (routerId: string) => {
    const response = await api.get(`/mikrotik/monitoring/${routerId}/interfaces`);
    return response.data;
  },

  forcePoll: async (routerId: string) => {
    const response = await api.post(`/mikrotik/monitoring/${routerId}/poll`);
    return response.data;
  },
};
