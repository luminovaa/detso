import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "../../global/text";
import { useThemeColor } from '@/src/lib/theme-colors';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
}

export function StepIndicator({ currentStep, totalSteps, labels }: StepIndicatorProps) {
  const colors = useThemeColor();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    stepsRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    circle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.input,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    circleActive: {
      backgroundColor: colors.info,
      borderColor: colors.info,
    },
    circleCurrent: {
      shadowColor: colors.info,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    },
    connector: {
      flex: 1,
      height: 2,
      backgroundColor: colors.border,
      marginHorizontal: 4,
    },
    connectorActive: {
      backgroundColor: colors.info,
    },
  }), [colors]);

  return (
    <View style={styles.container}>
      {/* Step circles + connectors */}
      <View style={styles.stepsRow}>
        {Array.from({ length: totalSteps }, (_, i) => {
          const stepNum = i + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;
          const isActive = isCompleted || isCurrent;

          return (
            <React.Fragment key={i}>
              {/* Circle */}
              <View
                style={[
                  styles.circle,
                  isActive && styles.circleActive,
                  isCurrent && styles.circleCurrent,
                ]}
              >
                <Text
                  weight="bold"
                  className={isActive ? "text-white text-[10px]" : "text-muted-foreground text-[10px]"}
                >
                  {stepNum}
                </Text>
              </View>

              {/* Connector line */}
              {i < totalSteps - 1 && (
                <View
                  style={[
                    styles.connector,
                    stepNum < currentStep && styles.connectorActive,
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>

      {/* Current step label */}
      {labels && labels[currentStep - 1] && (
        <Text weight="semibold" className="text-foreground text-sm mt-2 text-center">
          {labels[currentStep - 1]}
        </Text>
      )}
    </View>
  );
}
