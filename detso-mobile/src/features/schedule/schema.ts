import { z } from 'zod';
import { useLanguageStore } from '@/src/features/i18n/store';

const t = (key: string) => {
  const { locale, i18n } = useLanguageStore.getState();
  return i18n.t(key, { locale });
};

export const createWorkScheduleSchema = z.object({
  technician_id: z.string().min(1, t('validation.technicianIdRequired')),
  title: z.string().optional().nullable(),
  start_time: z.string().datetime(t('validation.timeFormatInvalid')),
  end_time: z.string().datetime(t('validation.timeFormatInvalid')).optional().nullable(),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED']).default('SCHEDULED'),
  notes: z.string().optional().nullable(),
  ticket_id: z.string().optional().nullable(),
});

export type CreateWorkScheduleInput = z.infer<typeof createWorkScheduleSchema>;

export const scheduleFilterSchema = z.object({
  month: z.coerce.number().min(1).max(12).optional(),
  year: z.coerce.number().min(2000).max(2100).optional(),
  technician_id: z.string().optional(),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED']).optional(),
});

export type ScheduleFilterInput = z.infer<typeof scheduleFilterSchema>;

export const updateScheduleSchema = z.object({
  technician_id: z.string().min(1, t('validation.technicianIdRequired')).optional(),
  title: z.string().optional().nullable(),
  start_time: z.string().datetime(t('validation.timeFormatInvalid')).optional(),
  end_time: z.string().datetime(t('validation.timeFormatInvalid')).optional().nullable(),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED']).optional(),
  notes: z.string().optional().nullable(),
  ticket_id: z.string().optional().nullable(),
});

export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;