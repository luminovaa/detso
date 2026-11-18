import React from "react";
import { View, TouchableOpacity } from "react-native";
import { Text } from "@/src/components/global/text";
import { Badge } from "@/src/components/global/badge";
import { useT } from "@/src/features/i18n/store";
import { TicketPriority, TicketType } from "@/src/lib/types";
import { TICKET_PRIORITY_OPTIONS, TICKET_TYPE_OPTIONS } from "@/src/features/ticket/form-helpers";

interface TicketTypePriorityFieldsProps {
  type: TicketType;
  priority: TicketPriority;
  onSelectType: (value: TicketType) => void;
  onSelectPriority: (value: TicketPriority) => void;
}

/**
 * Shared Type & Priority badge selectors for Ticket Create and Edit screens.
 */
export function TicketTypePriorityFields({
  type,
  priority,
  onSelectType,
  onSelectPriority,
}: TicketTypePriorityFieldsProps) {
  const { t } = useT();

  return (
    <>
      <View>
        <Text weight="medium" className="text-sm text-foreground mb-2">
          {t("ticket.typeLabel")}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {TICKET_TYPE_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              activeOpacity={0.7}
              className="min-h-11 justify-center"
              onPress={() => onSelectType(option.value)}
            >
              <Badge
                colorVariant={type === option.value ? option.variant : "neutral"}
                className={`px-4 py-1.5 ${type === option.value ? "opacity-100" : "opacity-50"}`}
              >
                {t(option.labelKey)}
              </Badge>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View>
        <Text weight="medium" className="text-sm text-foreground mb-2">
          {t("ticket.priorityLabel")}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {TICKET_PRIORITY_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              activeOpacity={0.7}
              className="min-h-11 justify-center"
              onPress={() => onSelectPriority(option.value)}
            >
              <Badge
                colorVariant={priority === option.value ? option.variant : "neutral"}
                className={`px-4 py-1.5 ${priority === option.value ? "opacity-100" : "opacity-50"}`}
              >
                {t(option.labelKey)}
              </Badge>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </>
  );
}
