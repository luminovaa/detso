import React, { forwardRef, useState, useCallback, useEffect } from 'react';
import { View, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { router } from 'expo-router';

import { Text } from '@/src/components/global/text';
import { Badge } from '@/src/components/global/badge';
import { Button } from '@/src/components/global/button';
import { Card } from '@/src/components/global/card';
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

interface InfoRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label?: string;
  value: string;
  compact?: boolean;
}

function InfoRow({ icon, label, value, compact }: InfoRowProps) {
  return (
    <View className={compact ? 'flex-row items-center gap-2' : 'gap-1'}>
      <View className="flex-row items-center gap-2">
        <Ionicons name={icon} size={compact ? 14 : 16} color={COLORS.neutral.gray[500]} />
        {label && !compact && (
          <Text className="text-xs text-muted-foreground">{label}</Text>
        )}
      </View>
      <Text className={compact ? 'text-xs text-muted-foreground flex-1' : 'text-sm text-foreground ml-6'}>
        {value}
      </Text>
    </View>
  );
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
  const canEdit = isAdminOrOwner;
  const canDelete = isAdminOrOwner;

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
        <BottomSheetScrollView className="flex-1">
          {/* Header */}
          <View className="px-4 py-3 border-b border-border">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
                <Ionicons name="calendar" size={20} color={COLORS.brand.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-semibold">
                  {schedule.title || t('schedule.untitled')}
                </Text>
                <Badge colorVariant={getScheduleStatusVariant(schedule.status)}>
                  {schedule.status}
                </Badge>
              </View>
            </View>
          </View>

          {/* Schedule Info */}
          <View className="px-4 py-4 gap-3">
            {/* Technician */}
            <InfoRow
              icon="person"
              label={t('schedule.technicianLabel')}
              value={schedule.technician?.full_name || schedule.technician?.username || '-'}
            />

            {/* Time */}
            <InfoRow
              icon="time"
              label={t('schedule.timeLabel')}
              value={formatScheduleTime(schedule.start_time, schedule.end_time, locale as 'en' | 'id')}
            />

            {/* Notes */}
            {schedule.notes && (
              <InfoRow
                icon="document-text"
                label={t('schedule.notesLabel')}
                value={schedule.notes}
              />
            )}
          </View>

          {/* Ticket Info (if exists) */}
          {schedule.ticket && (
            <View className="px-4 py-4 border-t border-border">
              <Text className="text-sm font-semibold mb-3">
                {t('schedule.ticketLabel')}
              </Text>
              
              {/* Ticket Card */}
              <Card className="p-3">
                <Text className="font-semibold mb-2">{schedule.ticket.title}</Text>
                
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
                  <View className="gap-2">
                    <InfoRow
                      icon="person"
                      value={schedule.ticket.customer.name}
                      compact
                    />
                    {schedule.ticket.customer.phone && (
                      <InfoRow
                        icon="call"
                        value={schedule.ticket.customer.phone}
                        compact
                      />
                    )}
                    {schedule.ticket.service?.address && (
                      <InfoRow
                        icon="location"
                        value={schedule.ticket.service.address}
                        compact
                      />
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
                    <Text className="text-primary">{t('schedule.viewTicketBtn')}</Text>
                  </View>
                </Button>
              </Card>
            </View>
          )}

          {/* Complete Section (if SCHEDULED & has access) */}
          {canComplete && (
            <CompleteScheduleSection
              schedule={schedule}
              photo={photo}
              setPhoto={setPhoto}
              notes={notes}
              setNotes={setNotes}
              onComplete={handleComplete}
              isLoading={isCompleting}
            />
          )}

          {/* Action Buttons (Admin/Owner only) */}
          {canEdit && (
            <View className="px-4 py-4 border-t border-border flex-row gap-3 mb-4">
              <Button
                variant="outline"
                className="flex-1"
                onPress={handleEdit}
              >
                <View className="flex-row items-center gap-2">
                  <Ionicons name="pencil" size={16} color={COLORS.brand.primary} />
                  <Text className="text-primary">{t('schedule.editBtn')}</Text>
                </View>
              </Button>

              {canDelete && (
                <Button
                  variant="destructive"
                  className="flex-1"
                  onPress={handleDelete}
                  isLoading={deleteSchedule.isPending}
                >
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="trash" size={16} color="white" />
                    <Text className="text-white">{t('schedule.deleteBtn')}</Text>
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
