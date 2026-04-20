// src/components/global/screen-wrapper.tsx
import React from "react";
import { 
  View, 
  StatusBar, 
  ScrollView, 
  RefreshControl, 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useColorScheme } from "nativewind";

interface ScreenWrapperProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  // Props tambahan untuk Refresh
  onRefresh?: () => void;
  refreshing?: boolean;
}

export function ScreenWrapper({ 
  children, 
  className = "", 
  noPadding = false,
  onRefresh,
  refreshing = false
}: ScreenWrapperProps) {
  const { colorScheme } = useColorScheme();
  
  // Konten utama
  const content = (
    <View className={`flex-1 ${noPadding ? "" : "px-4"}`}>
      {children}
    </View>
  );

  return (
    <SafeAreaView className={`flex-1 bg-background ${className}`}>
      <StatusBar 
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"} 
        backgroundColor="transparent" 
        translucent 
      />
      
      {onRefresh ? (
        // Jika ada fungsi onRefresh, bungkus dengan ScrollView + RefreshControl
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              // Sesuaikan warna dengan brand primary kamu
              colors={["hsl(217, 71%, 22%)"]} // Android
              tintColor={"hsl(217, 71%, 22%)"} // iOS
            />
          }
        >
          {content}
        </ScrollView>
      ) : (
        // Jika tidak butuh refresh (misal: layar statis atau Maps)
        content
      )}
    </SafeAreaView>
  );
}