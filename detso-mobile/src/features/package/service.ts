import api from '@/src/lib/api';
import { CreatePackageInput, GetAllPackageInput, UpdatePackageInput } from './schema';

export const packageService = {
  /**
   * Get all packages with optional pagination and filters.
   */
  getAll: async (params?: GetAllPackageInput) => {
    const response = await api.get('/package', { params });
    return response.data;
  },

  /**
   * Get a single package by ID.
   */
  getById: async (id: string) => {
    const response = await api.get(`/package/${id}`);
    return response.data;
  },

  /**
   * Create a new package.
   */
  create: async (data: CreatePackageInput) => {
    const response = await api.post('/package', data);
    return response.data;
  },

  /**
   * Update an existing package.
   */
  update: async (id: string, data: UpdatePackageInput) => {
    const response = await api.put(`/package/${id}`, data);
    return response.data;
  },

  /**
   * Delete a package.
   */
  delete: async (id: string) => {
    const response = await api.delete(`/package/${id}`);
    return response.data;
  },
};
