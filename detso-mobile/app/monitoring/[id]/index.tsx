import React from "react";
import { useLocalSearchParams } from "expo-router";
import { MonitoringDetail } from "@/src/components/screens/monitoring/monitoring-detail";

export default function MonitoringDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <MonitoringDetail routerId={id!} />;
}
