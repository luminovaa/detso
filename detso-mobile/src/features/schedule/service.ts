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
};
