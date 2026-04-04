import api from '@/src/lib/api';
import { GetAllUserInput, UpdatePasswordInput, UpdateUserInput } from './schema';

export const userService = {
  /**
   * Get all users with pagination and role filters.
   */
  getAll: async (params?: GetAllUserInput) => {
    const response = await api.get('/user', { params });
    return response.data;
  },

  /**
   * Get user details by ID.
   */
  getById: async (id: string) => {
    const response = await api.get(`/user/${id}`);
    return response.data;
  },

  /**
   * Update user information.
   * Supports FormData for avatar upload.
   */
  update: async (id: string, data: UpdateUserInput | FormData) => {
    const isFormData = data instanceof FormData;
    const response = await api.put(`/user/${id}`, data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },

  /**
   * Change the current user's password.
   */
  updatePassword: async (data: UpdatePasswordInput) => {
    const response = await api.patch('/user/change-password', data);
    return response.data;
  },

  /**
   * Get the user's profile photo.
   */
  getPhoto: async (id: string) => {
    const response = await api.get(`/user/image/${id}/photo`);
    return response.data;
  },

  /**
   * Delete a user record.
   */
  delete: async (id: string) => {
    const response = await api.delete(`/user/${id}`);
    return response.data;
  },
};

