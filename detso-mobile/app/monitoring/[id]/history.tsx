import React from "react";
import { useLocalSearchParams } from "expo-router";
import { MonitoringHistory } from "@/src/components/screens/monitoring/monitoring-history";

export default function MonitoringHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <MonitoringHistory routerId={id!} />;
}
