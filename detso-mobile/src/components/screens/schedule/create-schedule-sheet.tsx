import React, { forwardRef, useCallback } from 'react';
import { View, ScrollView } from 'react-native';
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
import { useCreateSchedule } from '@/src/features/schedule/hooks';
import { userService } from '@/src/features/user/service';
import { useTabBarHeight } from '@/src/hooks/use-tab-bar-height';

// Form schema for create schedule
const _t = (key: string) => {
  const { locale, i18n } = useLanguageStore.getState();
  return i18n.t(key, { locale });
};

const createScheduleFormSchema = z.object({
  title: z.string().optional(),
  technician_id: z.string().min(1, _t('validation.technicianRequired')),
  start_time: z.date(),
  end_time: z.date().optional(),
  notes: z.string().optional(),
});

type CreateScheduleFormData = z.infer<typeof createScheduleFormSchema>;

interface CreateScheduleSheetProps {
  defaultDate?: Date;
  onSuccess?: () => void;
}

function CreateScheduleSheetInner(
  { defaultDate, onSuccess }: CreateScheduleSheetProps,
  ref: React.ForwardedRef<BottomSheetModal>
) {
  const { t } = useT();
  const createMutation = useCreateSchedule();
  const { contentPaddingBottom } = useTabBarHeight();

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<CreateScheduleFormData>({
    resolver: zodResolver(createScheduleFormSchema),
    defaultValues: {
      title: '',
      technician_id: '',
      start_time: defaultDate || new Date(),
      end_time: undefined,
      notes: '',
    },
  });

  const onSubmit = async (data: CreateScheduleFormData) => {
    try {
      // Transform form data to API format
      const payload = {
        title: data.title || null,
        technician_id: data.technician_id,
        start_time: data.start_time.toISOString(),
        end_time: data.end_time?.toISOString() || null,
        status: 'SCHEDULED' as const,
        notes: data.notes || null,
        ticket_id: null,
      };

      await createMutation.mutateAsync(payload);
      reset();
      
      // Close sheet
      if (ref && typeof ref !== 'function' && ref.current) {
        ref.current.dismiss();
      }
      
      onSuccess?.();
    } catch (error) {
      // Error handled by mutation
      console.error('Create schedule error:', error);
    }
  };

  const handleClose = useCallback(() => {
    reset();
    if (ref && typeof ref !== 'function' && ref.current) {
      ref.current.dismiss();
    }
  }, [reset, ref]);

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
            {t('schedule.createTitle') || 'Buat Jadwal Baru'}
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
            label={t('schedule.form.title') || 'Judul'}
            placeholder={t('schedule.form.titlePlaceholder') || 'Contoh: Instalasi WiFi'}
          />

          {/* Technician (Required) */}
          <AsyncSelect
            control={control}
            name="technician_id"
            label={t('schedule.form.technician') || 'Teknisi'}
            placeholder={t('schedule.form.technicianPlaceholder')}
            required
            fetchOptions={fetchTechnicians}
          />

          {/* Start Date & Time (Required) */}
          <FormDatePicker
            control={control}
            name="start_time"
            label={t('schedule.form.startTime') || 'Waktu Mulai'}
            mode="datetime"
            required
            minimumDate={new Date()}
          />

          {/* End Date & Time (Optional) */}
          <FormDatePicker
            control={control}
            name="end_time"
            label={t('schedule.form.endTime') || 'Waktu Selesai'}
            mode="datetime"
            placeholder={t('schedule.form.endTimePlaceholder') || 'Opsional'}
          />

          {/* Notes (Optional) */}
          <FormInput
            control={control}
            name="notes"
            label={t('schedule.form.notes') || 'Catatan'}
            placeholder={t('schedule.form.notesPlaceholder') || 'Catatan tambahan...'}
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
                {t('schedule.form.submit') || 'Buat Jadwal'}
              </Text>
            </Button>
          </View>
        </BottomSheetScrollView>
      </View>
    </BottomSheetModal>
  );
}

export const CreateScheduleSheet = forwardRef(CreateScheduleSheetInner);
