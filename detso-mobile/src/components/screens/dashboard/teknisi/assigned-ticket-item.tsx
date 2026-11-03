import React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '@/src/components/global/text';
import { Badge } from '@/src/components/global/badge';
import { useT } from '@/src/features/i18n/store';
import { useThemeColor } from '@/src/lib/theme-colors';
import { TICKET_STATUS_VARIANTS } from '@/src/lib/ticket-constants';
import { TICKET_STATUS_LABEL_KEYS, TeknisiTicket } from '@/src/features/dashboard/teknisi-selectors';

export interface AssignedTicketItemProps {
  ticket: TeknisiTicket;
  isLast?: boolean;
  highlight?: boolean;
}

export function AssignedTicketItem({ ticket, isLast, highlight }: AssignedTicketItemProps) {
  const { t } = useT();
  const colors = useThemeColor();

  const priorityColors: Record<TeknisiTicket['priority'], string> = {
    LOW: colors.priorityLow,
    MEDIUM: colors.priorityMedium,
    HIGH: colors.priorityHigh,
    URGENT: colors.priorityUrgent,
  };

  const containerClassName = highlight
    ? 'bg-card border-2 border-primary rounded-2xl p-4 mb-3 flex-row items-center justify-between gap-3'
    : `flex-row items-center justify-between px-4 py-3.5 gap-3 ${isLast ? '' : 'border-b border-border/60'}`;

  return (
    <Pressable
      className={containerClassName}
      onPress={() => router.push(`/ticket/${ticket.id}/detail`)}
    >
      <View className="flex-row items-center flex-1 mr-2">
        <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
          <Ionicons
            name="document-text-outline"
            size={20}
            color={priorityColors[ticket.priority] ?? colors.primary}
          />
        </View>
        <View className="flex-1">
          <Text weight="semibold" className="text-sm font-sf-semibold text-foreground" numberOfLines={1}>
            {ticket.title}
          </Text>
          <Text className="text-xs text-muted-foreground mt-0.5" numberOfLines={1}>
            {ticket.customer?.name ?? '-'}
            {ticket.service?.package_name ? ` · ${ticket.service.package_name}` : ''}
          </Text>
        </View>
      </View>
      <Badge
        label={t(TICKET_STATUS_LABEL_KEYS[ticket.status])}
        colorVariant={TICKET_STATUS_VARIANTS[ticket.status]}
      />
    </Pressable>
  );
}
