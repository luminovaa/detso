import api from '@/src/lib/api';
import { CreateWorkScheduleInput, ScheduleFilterInput, UpdateScheduleInput } from './schema';
import { Schedule } from '@/src/lib/types';

/**
 * Transform API schedule response to frontend Schedule type.
 * Backend returns `start`/`end` (WIB without Z), frontend uses `start_time`/`end_time`.
 */
function mapApiSchedule(raw: any): Schedule {
  return {
    id: raw.id,
    title: raw.title || null,
    start_time: raw.start, // API field "start" → frontend "start_time"
    end_time: raw.end || null, // API field "end" → frontend "end_time"
    status: raw.status,
    notes: raw.notes || null,
    technician_id: raw.technician?.id || '',
    technician: raw.technician
      ? {
          id: raw.technician.id,
          username: raw.technician.username,
          full_name: raw.technician.full_name || null,
          avatar: null,
        }
      : undefined,
    ticket: raw.ticket
      ? { id: raw.ticket.id, title: raw.ticket.title }
      : null,
    ticket_id: raw.ticket?.id || null,
    created_at: raw.created_at || '',
    updated_at: raw.updated_at || '',
  };
}

export const scheduleService = {
  /**
   * Get all work schedules with optional filters (month, year, technician_id, status).
   */
  getAll: async (params?: ScheduleFilterInput) => {
    const response = await api.get('/schedule', { params });
    const result = response.data;

    // Transform schedules array to match frontend Schedule type
    if (result?.data?.schedules) {
      result.data.schedules = result.data.schedules.map(mapApiSchedule);
    }

    return result;
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
