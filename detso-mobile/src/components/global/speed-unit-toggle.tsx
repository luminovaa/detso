import React from "react";
import { View, Pressable, Text as RNText, StyleSheet } from "react-native";

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
  return (
    <View style={styles.container}>
      {UNITS.map((unit) => {
        const isActive = value === unit;
        return (
          <Pressable
            key={unit}
            onPress={() => onChange(unit)}
            style={[styles.pill, isActive && styles.pillActive]}
          >
            <RNText style={[styles.text, isActive && styles.textActive]}>
              {unit}
            </RNText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    padding: 2,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pillActive: {
    backgroundColor: "hsl(221.2, 83.2%, 53.3%)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94a3b8",
  },
  textActive: {
    color: "#ffffff",
  },
});
