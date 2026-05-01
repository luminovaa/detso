import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "../../global/text";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
}

export function StepIndicator({ currentStep, totalSteps, labels }: StepIndicatorProps) {
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

const styles = StyleSheet.create({
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
    backgroundColor: "#f1f5f9",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  circleActive: {
    backgroundColor: "hsl(221.2, 83.2%, 53.3%)",
    borderColor: "hsl(221.2, 83.2%, 53.3%)",
  },
  circleCurrent: {
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  connector: {
    flex: 1,
    height: 2,
    backgroundColor: "#e2e8f0",
    marginHorizontal: 4,
  },
  connectorActive: {
    backgroundColor: "hsl(221.2, 83.2%, 53.3%)",
  },
});
