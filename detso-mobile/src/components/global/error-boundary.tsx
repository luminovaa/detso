import React, { Component, ErrorInfo, ReactNode } from "react";
import { View, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "./text";
import { Button } from "./button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  // Fungsi ini dipanggil otomatis oleh React jika ada error di child components
  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Di sini kamu bisa mengirim log error ke Sentry, Crashlytics, atau Datadog
    console.error("🚨 GLOBAL UI ERROR CAUGHT:", error, errorInfo);
  }

  private handleReset = () => {
    // Reset state agar aplikasi mencoba merender ulang
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        // Layar Fallback ketika aplikasi Crash
        <View className="flex-1 bg-background items-center justify-center px-6">
          <View className="bg-destructive/10 w-24 h-24 rounded-full items-center justify-center mb-6">
            <Ionicons name="warning" size={48} color="#ef4444" />
          </View>

          <Text
            weight="bold"
            className="text-3xl text-foreground mb-3 text-center"
          >
            Aduh, Ada Sistem yang Rusak!
          </Text>

          <Text className="text-muted-foreground text-center mb-8 px-4">
            Aplikasi mengalami kesalahan sistem yang tidak terduga. Kami telah
            mencatat masalah ini.
          </Text>

          {/* Menampilkan pesan error teknis (Opsional, sangat berguna untuk developer) */}
          {__DEV__ && this.state.error && (
            <ScrollView className="bg-muted p-4 rounded-xl w-full max-h-40 mb-8 border border-border">
              <Text className="text-xs text-destructive font-mono">
                {this.state.error.message}
              </Text>
            </ScrollView>
          )}

          <Button
            title="Muat Ulang Aplikasi"
            variant="primary"
            onPress={this.handleReset}
            className="w-full max-w-sm"
          />
        </View>
      );
    }

    // Jika tidak ada error, render aplikasi seperti biasa
    return this.props.children;
  }
}
