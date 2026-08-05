import React from "react";
import { useLocalSearchParams } from "expo-router";
import { PPPoESessions } from "@/src/components/screens/monitoring/pppoe-sessions";

export default function PPPoESessionsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PPPoESessions routerId={id!} />;
}
