import React from "react";
import { View, Pressable, Text as RNText } from "react-native";
import { useThemeColor, createShadow } from "@/src/lib/theme-colors";

export type SpeedUnit = "Mbps" | "Gbps";

interface SpeedUnitToggleProps {
  value: SpeedUnit;
  onChange: (unit: SpeedUnit) => void;
}

const UNITS: SpeedUnit[] = ["Mbps", "Gbps"];

/**
 * Inline pill toggle for speed unit selection (Mbps / Gbps)
 * Designed to be used as a suffix inside an Input component
 * Uses pure StyleSheet to avoid NativeWind/Navigation context issues
 */
export function SpeedUnitToggle({ value, onChange }: SpeedUnitToggleProps) {
  const colors = useThemeColor();

  return (
    <View style={{ flexDirection: "row", backgroundColor: colors.input, borderRadius: 8, padding: 2 }}>
      {UNITS.map((unit) => {
        const isActive = value === unit;
        return (
          <Pressable
            key={unit}
            onPress={() => onChange(unit)}
            style={[
              { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
              isActive && {
                backgroundColor: colors.primary,
                ...createShadow(colors.shadow, 0.1, 2, 2),
                shadowOffset: { width: 0, height: 1 },
              },
            ]}
          >
            <RNText
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: isActive ? colors.white : colors.textMuted,
              }}
            >
              {unit}
            </RNText>
          </Pressable>
        );
      })}
    </View>
  );
}
