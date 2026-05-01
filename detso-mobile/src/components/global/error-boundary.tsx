import React, { Component, ErrorInfo, ReactNode } from "react";
import { View, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "./text";
import { Button } from "./button";
import { useT } from "@/src/features/i18n/store";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// Functional wrapper to inject i18n into class component
function ErrorFallback({ error, onReset }: { error: Error | null; onReset: () => void }) {
  const { t } = useT();

  return (
    <View className="flex-1 bg-background items-center justify-center px-6">
      <View className="bg-destructive/10 w-24 h-24 rounded-full items-center justify-center mb-6">
        <Ionicons name="warning" size={48} color="#ef4444" />
      </View>

      <Text
        weight="bold"
        className="text-3xl text-foreground mb-3 text-center"
      >
        {t("errorBoundary.title")}
      </Text>

      <Text className="text-muted-foreground text-center mb-8 px-4">
        {t("errorBoundary.desc")}
      </Text>

      {__DEV__ && error && (
        <ScrollView className="bg-muted p-4 rounded-xl w-full max-h-40 mb-8 border border-border">
          <Text className="text-xs text-destructive font-mono">
            {error.message}
          </Text>
        </ScrollView>
      )}

      <Button
        title={t("errorBoundary.reloadBtn")}
        variant="primary"
        onPress={onReset}
        className="w-full max-w-sm"
      />
    </View>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("🚨 GLOBAL UI ERROR CAUGHT:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}
