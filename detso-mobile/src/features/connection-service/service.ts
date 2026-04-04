import api from '@/src/lib/api';
import { UpdateServiceConnectionInput } from './schema';

export const connectionService = {
  /**
   * Create a new service connection (Installation).
   * Since this usually involves uploading photos, data should be passed as FormData from the screen.
   */
  create: async (data: FormData) => {
    const response = await api.post('/service-connection', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Update an existing service connection.
   * Can accept plain object or FormData if files are being updated.
   */
  update: async (id: string, data: UpdateServiceConnectionInput | FormData) => {
    const isFormData = data instanceof FormData;
    const response = await api.put(`/service-connection/${id}`, data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },

  /**
   * Delete a service connection record.
   */
  delete: async (id: string) => {
    const response = await api.delete(`/service-connection/${id}`);
    return response.data;
  },
};
