import api from '@/src/lib/api';
import { GetAllTenantInput, UpdateTenantInput } from './schema';

export const tenantService = {
  /**
   * Get all tenants with filters (month, year, technician_id, status).
   * Typically for SaaS Super Admin.
   */
  getAll: async (params?: GetAllTenantInput) => {
    const response = await api.get('/tenant', { params });
    return response.data;
  },

  /**
   * Get a single tenant record by ID.
   */
  getById: async (id: string) => {
    const response = await api.get(`/tenant/${id}`);
    return response.data;
  },

  /**
   * Update an existing tenant.
   * Can accept plain object or FormData for logo upload.
   */
  update: async (id: string, data: UpdateTenantInput | FormData) => {
    const isFormData = data instanceof FormData;
    const response = await api.put(`/tenant/${id}`, data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },

  /**
   * Get tenant logo.
   */
  getLogo: async (id: string) => {
    const response = await api.get(`/tenant/${id}/logo`);
    return response.data;
  },

  /**
   * Delete a tenant record.
   */
  delete: async (id: string) => {
    const response = await api.delete(`/tenant/${id}`);
    return response.data;
  },
};
