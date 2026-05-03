import api from '@/src/lib/api';
import { CreateWorkScheduleInput, ScheduleFilterInput, UpdateScheduleInput } from './schema';

export const scheduleService = {
  /**
   * Get all work schedules with optional filters (month, year, technician_id, status).
   */
  getAll: async (params?: ScheduleFilterInput) => {
    const response = await api.get('/schedule', { params });
    return response.data;
  },

  /**
   * Get a single schedule record by ID.
   */
  getById: async (id: string) => {
    const response = await api.get(`/schedule/${id}`);
    return response.data;
  },

  /**
   * Create a new work schedule.
   */
  create: async (data: CreateWorkScheduleInput) => {
    const response = await api.post('/schedule', data);
    return response.data;
  },

  /**
   * Update an existing work schedule.
   */
  update: async (id: string, data: UpdateScheduleInput) => {
    const response = await api.put(`/schedule/${id}`, data);
    return response.data;
  },

  /**
   * Delete a work schedule.
   */
  delete: async (id: string) => {
    const response = await api.delete(`/schedule/${id}`);
    return response.data;
  },

  /**
   * Complete a schedule (with optional photo upload).
   * Sends FormData to support file upload.
   */
  complete: async (id: string, formData: FormData) => {
    const response = await api.put(`/schedule/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
