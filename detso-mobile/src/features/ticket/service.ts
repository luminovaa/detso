import api from '@/src/lib/api';
import { CreateTicketInput, GetAllTicketInput, UpdateTicketInput } from './schema';

export const ticketService = {
  /**
   * Get all tickets with pagination and filters.
   */
  getAll: async (params?: GetAllTicketInput) => {
    const response = await api.get('/ticket', { params });
    return response.data;
  },

  /**
   * Get ticket details by ID.
   */
  getById: async (id: string) => {
    const response = await api.get(`/ticket/${id}`);
    return response.data;
  },

  /**
   * Create a new ticket.
   */
  create: async (data: CreateTicketInput) => {
    const response = await api.post('/ticket', data);
    return response.data;
  },

  /**
   * Update ticket status (supports image upload via FormData).
   */
  updateStatus: async (id: string, formData: FormData) => {
    const response = await api.put(`/ticket/status/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Edit ticket details (supports image upload via FormData).
   */
  update: async (id: string, data: UpdateTicketInput | FormData) => {
    const isFormData = data instanceof FormData;
    const response = await api.put(`/ticket/${id}`, data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },

  /**
   * Get ticket history logs.
   */
  getHistory: async (id: string) => {
    const response = await api.get(`/ticket/${id}/history`);
    return response.data;
  },

  /**
   * Delete a ticket.
   */
  delete: async (id: string) => {
    const response = await api.delete(`/ticket/${id}`);
    return response.data;
  },
};
