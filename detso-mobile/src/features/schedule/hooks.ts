import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scheduleService } from './service';
import { CreateWorkScheduleInput, ScheduleFilterInput, UpdateScheduleInput } from './schema';
import { eventBus, EVENTS } from '@/src/lib/event-bus';
import { showToast } from '@/src/components/global/toast';
import { showErrorToast } from '@/src/lib/api-error';
import { useT } from '@/src/features/i18n/store';

// ─── Query Keys ──────────────────────────────────────────────────
export const scheduleKeys = {
  all: ['schedules'] as const,
  lists: () => [...scheduleKeys.all, 'list'] as const,
  list: (params?: ScheduleFilterInput) => [...scheduleKeys.lists(), params] as const,
  details: () => [...scheduleKeys.all, 'detail'] as const,
  detail: (id: string) => [...scheduleKeys.details(), id] as const,
};

// ─── Queries ─────────────────────────────────────────────────────

/** Fetch work schedules with optional month/year/technician filters. */
export function useSchedules(params?: ScheduleFilterInput) {
  return useQuery({
    queryKey: scheduleKeys.list(params),
    queryFn: () => scheduleService.getAll(params),
  });
}

/** Fetch a single schedule by ID. */
export function useSchedule(id: string) {
  return useQuery({
    queryKey: scheduleKeys.detail(id),
    queryFn: () => scheduleService.getById(id),
    enabled: !!id,
  });
}

// ─── Mutations ───────────────────────────────────────────────────

/** Create a new work schedule. */
export function useCreateSchedule() {
  const qc = useQueryClient();
  const { t } = useT();

  return useMutation({
    mutationFn: (data: CreateWorkScheduleInput) => scheduleService.create(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: scheduleKeys.lists() });
      eventBus.emit(EVENTS.SCHEDULE.CREATED, { scheduleId: res?.data?.id ?? '' });
      showToast.success(t('common.success'), t('schedule.createSuccess'));
    },
    onError: (error) => {
      showErrorToast(error, t('schedule.createFailed'));
    },
  });
}

/** Update an existing work schedule. */
export function useUpdateSchedule() {
  const qc = useQueryClient();
  const { t } = useT();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateScheduleInput }) =>
      scheduleService.update(id, data),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: scheduleKeys.detail(id) });
      qc.invalidateQueries({ queryKey: scheduleKeys.lists() });
      eventBus.emit(EVENTS.SCHEDULE.UPDATED, { scheduleId: id });
      showToast.success(t('common.success'), t('schedule.updateSuccess'));
    },
    onError: (error) => {
      showErrorToast(error, t('schedule.updateFailed'));
    },
  });
}
