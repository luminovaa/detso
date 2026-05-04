import React, { forwardRef, useState, useCallback, useEffect } from 'react';
import { View, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { router } from 'expo-router';

import { Text } from '@/src/components/global/text';
import { Badge } from '@/src/components/global/badge';
import { Button } from '@/src/components/global/button';
import { CompleteScheduleSection } from './complete-schedule-section';

import { useT, useLanguageStore } from '@/src/features/i18n/store';
import { useAuthStore } from '@/src/features/auth/store';
import { useSchedule, useUpdateSchedule, useDeleteSchedule, useCompleteSchedule } from '@/src/features/schedule/hooks';
import { useUpdateTicketStatus } from '@/src/features/ticket/hooks';
import { showToast } from '@/src/components/global/toast';
import { showErrorToast } from '@/src/lib/api-error';

import { Schedule } from '@/src/lib/types';
import { formatScheduleTime, getScheduleStatusVariant } from '@/src/lib/schedule-utils';
import { TICKET_PRIORITY_VARIANTS, TICKET_STATUS_VARIANTS } from '@/src/lib/ticket-constants';
import { COLORS } from '@/src/lib/colors';

interface ScheduleDetailSheetProps {
  scheduleId: string | null;
  onDismiss?: () => void;
  onEdit?: (schedule: Schedule) => void;
  onSuccess?: () => void;
}

function ScheduleDetailSheetInner(
  { scheduleId, onDismiss, onEdit, onSuccess }: ScheduleDetailSheetProps,
  ref: React.ForwardedRef<BottomSheetModal>
) {
  const { t } = useT();
  const { locale } = useLanguageStore();
  const user = useAuthStore((s) => s.user);

  // Fetch schedule detail
  const { data: scheduleData, isLoading } = useSchedule(scheduleId || '');
  const schedule = scheduleData?.data as Schedule | undefined;

  // Mutations
  const updateSchedule = useUpdateSchedule();
  const updateTicketStatus = useUpdateTicketStatus();
  const deleteSchedule = useDeleteSchedule();
  const completeSchedule = useCompleteSchedule();

  // Complete schedule state
  const [photo, setPhoto] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);

  // Reset state when schedule changes
  useEffect(() => {
    if (schedule) {
      setPhoto(null);
      setNotes('');
    }
  }, [schedule?.id]);

  // Role-based access control
  const isOwnSchedule = schedule?.technician_id === user?.id;
  const isAdminOrOwner = user?.role === 'TENANT_OWNER' || user?.role === 'TENANT_ADMIN';
  
  const canComplete = schedule?.status === 'SCHEDULED' && (isAdminOrOwner || isOwnSchedule);
  const canEdit = isAdminOrOwner && schedule?.status === 'SCHEDULED';
  const canDelete = isAdminOrOwner && schedule?.status === 'SCHEDULED';

  const handleComplete = useCallback(async () => {
    if (!schedule) return;

    setIsCompleting(true);

    try {
      if (schedule.ticket_id) {
        // Scenario A: Schedule with Ticket
        // Update ticket status → auto-complete schedule
        
        if (!photo) {
          showToast.error(t('common.error'), t('schedule.photoRequired'));
          setIsCompleting(false);
          return;
        }

        const formData = new FormData();
        formData.append('status', 'RESOLVED');
        
        if (notes.trim()) {
          formData.append('description', notes.trim());
        }

        // Append photo
        const filename = photo.split('/').pop() || 'photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        formData.append('image', {
          uri: photo,
          name: filename,
          type,
        } as any);

        await updateTicketStatus.mutateAsync({
          id: schedule.ticket_id,
          formData,
        });

      } else {
        // Scenario B: Schedule without Ticket
        // Send FormData to schedule endpoint (supports photo upload)
        
        const formData = new FormData();
        formData.append('status', 'COMPLETED');
        formData.append('end_time', new Date().toISOString());
        
        if (notes.trim()) {
          formData.append('notes', notes.trim());
        }

        // Append photo if provided (optional for non-ticket schedules)
        if (photo) {
          const filename = photo.split('/').pop() || 'photo.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';
          formData.append('image', {
            uri: photo,
            name: filename,
            type,
          } as any);
        }

        await completeSchedule.mutateAsync({
          id: schedule.id,
          formData,
        });
      }

      // Success
      showToast.success(t('common.success'), t('schedule.completeSuccess'));
      (ref as any)?.current?.dismiss();
      onSuccess?.();

    } catch (error) {
      showErrorToast(error, t('schedule.completeFailed'));
    } finally {
      setIsCompleting(false);
    }
  }, [schedule, photo, notes, t, updateTicketStatus, updateSchedule, ref, onSuccess]);

  const handleEdit = useCallback(() => {
    if (schedule) {
      (ref as any)?.current?.dismiss();
      onEdit?.(schedule);
    }
  }, [schedule, ref, onEdit]);

  const handleDelete = useCallback(() => {
    if (!schedule) return;

    Alert.alert(
      t('schedule.deleteConfirm'),
      t('schedule.deleteMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('schedule.deleteBtn'),
          style: 'destructive',
          onPress: () => {
            deleteSchedule.mutate(schedule.id, {
              onSuccess: () => {
                (ref as any)?.current?.dismiss();
                onSuccess?.();
              },
            });
          },
        },
      ]
    );
  }, [schedule, t, deleteSchedule, ref, onSuccess]);

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

  if (!schedule && !isLoading) return null;

  // Don't render if no scheduleId
  if (!scheduleId) return null;

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={['70%']}
      backdropComponent={renderBackdrop}
      enablePanDownToClose
      enableDismissOnClose
      onDismiss={onDismiss}
      enableContentPanningGesture={false}
      enableHandlePanningGesture={true}
    >
      {isLoading || !schedule ? (
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-muted-foreground">{t('common.loading')}</Text>
        </View>
      ) : (
        <BottomSheetScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
          {/* Header - Title + Status */}
          <View className="px-5 pt-4 pb-3">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 mr-3">
                <Text weight="bold" className="text-xl text-foreground">
                  {schedule.title || t('schedule.untitled')}
                </Text>
              </View>
              <Badge colorVariant={getScheduleStatusVariant(schedule.status)}>
                {schedule.status}
              </Badge>
            </View>
          </View>

          {/* Time Card - Most Important Info */}
          <View className="px-5 pb-4">
            <View className="bg-primary/5 border border-primary/10 rounded-2xl p-4">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
                  <Ionicons name="time" size={20} color={COLORS.brand.primary} />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-muted-foreground">{t('schedule.timeLabel')}</Text>
                  <Text weight="semibold" className="text-sm text-foreground mt-0.5">
                    {formatScheduleTime(schedule.start_time, schedule.end_time, locale as 'en' | 'id')}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Info Section */}
          <View className="px-5 gap-4">
            {/* Technician */}
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-900/30 items-center justify-center">
                <Ionicons name="person" size={16} color="#3B82F6" />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-muted-foreground">{t('schedule.technicianLabel')}</Text>
                <Text weight="medium" className="text-sm text-foreground">
                  {schedule.technician?.full_name || schedule.technician?.username || '-'}
                </Text>
              </View>
            </View>

            {/* Notes */}
            {schedule.notes && (
              <View className="flex-row items-start gap-3">
                <View className="w-9 h-9 rounded-full bg-amber-50 dark:bg-amber-900/30 items-center justify-center">
                  <Ionicons name="document-text" size={16} color="#F59E0B" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-muted-foreground">{t('schedule.notesLabel')}</Text>
                  <Text className="text-sm text-foreground mt-0.5">
                    {schedule.notes}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Ticket Info (if exists) */}
          {schedule.ticket && (
            <View className="px-5 mt-5">
              <View className="flex-row items-center gap-2 mb-3">
                <Ionicons name="ticket" size={16} color={COLORS.neutral.gray[500]} />
                <Text weight="semibold" className="text-sm text-foreground">
                  {t('schedule.ticketLabel')}
                </Text>
              </View>
              
              {/* Ticket Card */}
              <View className="bg-muted/30 border border-border/50 rounded-2xl p-4">
                <Text weight="semibold" className="text-sm text-foreground mb-2">
                  {schedule.ticket.title}
                </Text>
                
                {/* Badges */}
                <View className="flex-row gap-2 mb-3">
                  {schedule.ticket.priority && (
                    <Badge colorVariant={TICKET_PRIORITY_VARIANTS[schedule.ticket.priority] || 'neutral'}>
                      {schedule.ticket.priority}
                    </Badge>
                  )}
                  {schedule.ticket.status && (
                    <Badge colorVariant={TICKET_STATUS_VARIANTS[schedule.ticket.status] || 'neutral'}>
                      {schedule.ticket.status}
                    </Badge>
                  )}
                </View>

                {/* Customer Info */}
                {schedule.ticket.customer && (
                  <View className="gap-2 pt-2 border-t border-border/30">
                    <View className="flex-row items-center gap-2">
                      <Ionicons name="person-outline" size={14} color={COLORS.neutral.gray[400]} />
                      <Text className="text-xs text-foreground">{schedule.ticket.customer.name}</Text>
                    </View>
                    {schedule.ticket.customer.phone && (
                      <View className="flex-row items-center gap-2">
                        <Ionicons name="call-outline" size={14} color={COLORS.neutral.gray[400]} />
                        <Text className="text-xs text-muted-foreground">{schedule.ticket.customer.phone}</Text>
                      </View>
                    )}
                    {schedule.ticket.service?.address && (
                      <View className="flex-row items-center gap-2">
                        <Ionicons name="location-outline" size={14} color={COLORS.neutral.gray[400]} />
                        <Text className="text-xs text-muted-foreground" numberOfLines={2}>{schedule.ticket.service.address}</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* View Ticket Button */}
                <Button
                  variant="outline"
                  className="mt-3"
                  onPress={() => {
                    (ref as any)?.current?.dismiss();
                    router.push(`/ticket/${schedule.ticket_id}/detail` as any);
                  }}
                >
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="eye-outline" size={16} color={COLORS.brand.primary} />
                    <Text className="text-primary text-sm">{t('schedule.viewTicketBtn')}</Text>
                  </View>
                </Button>
              </View>
            </View>
          )}

          {/* Complete Section (if SCHEDULED & has access) */}
          {canComplete && (
            <View className="mt-4">
              <CompleteScheduleSection
                schedule={schedule}
                photo={photo}
                setPhoto={setPhoto}
                notes={notes}
                setNotes={setNotes}
                onComplete={handleComplete}
                isLoading={isCompleting}
              />
            </View>
          )}

          {/* Action Buttons (Admin/Owner only, SCHEDULED status) */}
          {(canEdit || canDelete) && (
            <View className="px-5 pt-4 mt-2 border-t border-border/50 flex-row gap-3">
              {canEdit && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onPress={handleEdit}
                >
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="pencil" size={16} color={COLORS.brand.primary} />
                    <Text className="text-primary text-sm">{t('schedule.editBtn')}</Text>
                  </View>
                </Button>
              )}

              {canDelete && (
                <Button
                  variant="destructive"
                  className="flex-1"
                  onPress={handleDelete}
                  isLoading={deleteSchedule.isPending}
                >
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="trash" size={16} color="white" />
                    <Text className="text-white text-sm">{t('schedule.deleteBtn')}</Text>
                  </View>
                </Button>
              )}
            </View>
          )}
        </BottomSheetScrollView>
      )}
    </BottomSheetModal>
  );
}

export const ScheduleDetailSheet = forwardRef(ScheduleDetailSheetInner);
