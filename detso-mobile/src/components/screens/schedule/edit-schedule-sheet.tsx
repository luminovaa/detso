import React, { forwardRef, useCallback, useEffect } from 'react';
import { View } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { z } from 'zod';

import { Text } from '@/src/components/global/text';
import { Button } from '@/src/components/global/button';
import { FormInput } from '@/src/components/global/form-input';
import { FormDatePicker } from '@/src/components/global/date-picker';
import { AsyncSelect } from '@/src/components/global/select-searchable';
import { useT, useLanguageStore } from '@/src/features/i18n/store';
import { useUpdateSchedule } from '@/src/features/schedule/hooks';
import { userService } from '@/src/features/user/service';
import { useTabBarHeight } from '@/src/hooks/use-tab-bar-height';
import { Schedule } from '@/src/lib/types';

// Form schema for edit schedule
const _t = (key: string) => {
  const { locale, i18n } = useLanguageStore.getState();
  return i18n.t(key, { locale });
};

const editScheduleFormSchema = z.object({
  title: z.string().optional(),
  technician_id: z.string().min(1, _t('validation.technicianRequired')),
  start_time: z.date(),
  end_time: z.date().optional().nullable(),
  notes: z.string().optional(),
});

type EditScheduleFormData = z.infer<typeof editScheduleFormSchema>;

interface EditScheduleSheetProps {
  schedule: Schedule | null;
  onSuccess?: () => void;
}

function EditScheduleSheetInner(
  { schedule, onSuccess }: EditScheduleSheetProps,
  ref: React.ForwardedRef<BottomSheetModal>
) {
  const { t } = useT();
  const updateMutation = useUpdateSchedule();
  const { contentPaddingBottom } = useTabBarHeight();

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<EditScheduleFormData>({
    resolver: zodResolver(editScheduleFormSchema),
    defaultValues: {
      title: schedule?.title || '',
      technician_id: schedule?.technician_id || '',
      start_time: schedule?.start_time ? new Date(schedule.start_time) : new Date(),
      end_time: schedule?.end_time ? new Date(schedule.end_time) : undefined,
      notes: schedule?.notes || '',
    },
  });

  // Reset form when schedule changes
  useEffect(() => {
    if (schedule) {
      reset({
        title: schedule.title || '',
        technician_id: schedule.technician_id,
        start_time: new Date(schedule.start_time),
        end_time: schedule.end_time ? new Date(schedule.end_time) : undefined,
        notes: schedule.notes || '',
      });
    }
  }, [schedule, reset]);

  const onSubmit = async (data: EditScheduleFormData) => {
    if (!schedule) return;

    try {
      // Transform form data to API format
      const payload = {
        title: data.title || null,
        technician_id: data.technician_id,
        start_time: data.start_time.toISOString(),
        end_time: data.end_time?.toISOString() || null,
        notes: data.notes || null,
      };

      await updateMutation.mutateAsync({
        id: schedule.id,
        data: payload,
      });
      
      // Close sheet
      if (ref && typeof ref !== 'function' && ref.current) {
        ref.current.dismiss();
      }
      
      onSuccess?.();
    } catch (error) {
      // Error handled by mutation
      console.error('Update schedule error:', error);
    }
  };

  const handleClose = useCallback(() => {
    if (ref && typeof ref !== 'function' && ref.current) {
      ref.current.dismiss();
    }
  }, [ref]);

  // Fetch technicians for select
  const fetchTechnicians = async (search: string, page: number) => {
    const response = await userService.getAll({
      page,
      limit: 20,
      search,
      role: 'TENANT_TEKNISI',
    });

    return {
      data: response.data.users.map((user: any) => ({
        value: user.id,
        label: user.profile?.full_name || user.username,
        description: user.username,
      })),
      hasNextPage: response.data.pagination.hasNextPage,
    };
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  if (!schedule) return null;

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={['90%']}
      backdropComponent={renderBackdrop}
      enablePanDownToClose
      enableDismissOnClose
      enableContentPanningGesture={false}
      enableHandlePanningGesture={true}
    >
      <View className="flex-1">
        {/* Header */}
        <View className="px-4 py-3 border-b border-border">
          <Text className="text-lg font-semibold">
            {t('schedule.editTitle')}
          </Text>
        </View>

        {/* Form - Scrollable */}
        <BottomSheetScrollView 
          className="flex-1 px-4 pt-4" 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: contentPaddingBottom }}
        >
          {/* Title (Optional) */}
          <FormInput
            control={control}
            name="title"
            label={t('schedule.form.title')}
            placeholder={t('schedule.form.titlePlaceholder')}
          />

          {/* Technician (Required) */}
          <AsyncSelect
            key={`technician-${schedule?.id}`}
            control={control}
            name="technician_id"
            label={t('schedule.form.technician')}
            placeholder={t('schedule.form.technicianPlaceholder')}
            required
            fetchOptions={fetchTechnicians}
            initialLabel={schedule?.technician?.full_name || schedule?.technician?.username || ''}
          />

          {/* Start Date & Time (Required) */}
          <FormDatePicker
            control={control}
            name="start_time"
            label={t('schedule.form.startTime')}
            mode="datetime"
            required
            minimumDate={new Date()}
          />

          {/* End Date & Time (Optional) */}
          <FormDatePicker
            control={control}
            name="end_time"
            label={t('schedule.form.endTime')}
            mode="datetime"
            placeholder={t('schedule.form.endTimePlaceholder')}
          />

          {/* Notes (Optional) */}
          <FormInput
            control={control}
            name="notes"
            label={t('schedule.form.notes')}
            placeholder={t('schedule.form.notesPlaceholder')}
            multiline
            numberOfLines={4}
          />

          {/* Action Buttons */}
          <View className="flex-row gap-3 mt-6 mb-8">
            <Button
              variant="outline"
              onPress={handleClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              <Text className="text-foreground font-semibold">
                {t('common.cancel')}
              </Text>
            </Button>

            <Button
              onPress={handleSubmit(onSubmit)}
              className="flex-1"
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              <Text className="text-primary-foreground font-semibold">
                {t('schedule.form.update')}
              </Text>
            </Button>
          </View>
        </BottomSheetScrollView>
      </View>
    </BottomSheetModal>
  );
}

export const EditScheduleSheet = forwardRef(EditScheduleSheetInner);
