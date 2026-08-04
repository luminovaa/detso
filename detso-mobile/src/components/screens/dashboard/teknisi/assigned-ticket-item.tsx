import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '@/src/components/global/text';
import { Badge } from '@/src/components/global/badge';
import { useT } from '@/src/features/i18n/store';
import { useThemeColor } from '@/src/lib/theme-colors';
import { TICKET_STATUS_VARIANTS, TICKET_PRIORITY_COLORS } from '@/src/lib/ticket-constants';
import { TICKET_STATUS_LABEL_KEYS, TeknisiTicket } from '@/src/features/dashboard/teknisi-selectors';

export function AssignedTicketItem({ ticket }: { ticket: TeknisiTicket }) {
  const { t } = useT();
  const colors = useThemeColor();

  return (
    <TouchableOpacity
      className="bg-card border border-border rounded-xl p-4 mb-3 flex-row items-center"
      activeOpacity={0.7}
      onPress={() => router.push(`/ticket/${ticket.id}/detail`)}
    >
      <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
        <Ionicons
          name="document-text-outline"
          size={20}
          color={TICKET_PRIORITY_COLORS[ticket.priority] ?? colors.primary}
        />
      </View>
      <View className="flex-1 mr-2">
        <Text weight="semibold" className="text-foreground" numberOfLines={1}>
          {ticket.title}
        </Text>
        <Text className="text-xs text-muted-foreground mt-0.5" numberOfLines={1}>
          {ticket.customer?.name ?? '-'}
          {ticket.service?.package_name ? ` · ${ticket.service.package_name}` : ''}
        </Text>
      </View>
      <Badge
        label={t(TICKET_STATUS_LABEL_KEYS[ticket.status])}
        colorVariant={TICKET_STATUS_VARIANTS[ticket.status]}
      />
    </TouchableOpacity>
  );
}
