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
import { Header } from "./header";

interface ScreenWrapperProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  // Props tambahan untuk Refresh
  onRefresh?: () => void;
  refreshing?: boolean;
  // Props untuk Header
  headerTitle?: string;
  showBackButton?: boolean;
  headerRightNode?: React.ReactNode;
  onBackPress?: () => void;
}

export function ScreenWrapper({ 
  children, 
  className = "", 
  noPadding = false,
  onRefresh,
  refreshing = false,
  headerTitle,
  showBackButton = false,
  headerRightNode,
  onBackPress
}: ScreenWrapperProps) {
  const { colorScheme } = useColorScheme();
  const hasHeader = !!headerTitle;
  
    // Konten utama
  const content = (
    <>
      {/* Header di luar padding, full-width dengan status bar */}
      {hasHeader && (
        <Header 
          title={headerTitle}
          showBackButton={showBackButton}
          rightNode={headerRightNode}
          onBackPress={onBackPress}
        />
      )}
      
      {/* Content dengan padding dan rounded top */}
      <View 
        className={`flex-1 bg-background rounded-t-[32px] ${noPadding ? "" : "px-4"}`}
        style={{ marginTop: hasHeader ? -24 : 0, paddingTop: hasHeader ? 24 : 0 }}
      >
        {children}
      </View>
    </>
  );

  return (
    <SafeAreaView 
      className={`flex-1 bg-background ${className}`}
      // Jika ada header, matikan safe area atas agar header menutupi status bar
      edges={hasHeader ? ["bottom", "left", "right"] : ["top", "bottom", "left", "right"]}
    >
      <StatusBar 
        barStyle={hasHeader ? "light-content" : (colorScheme === "dark" ? "light-content" : "dark-content")} 
        backgroundColor="transparent" 
        translucent 
      />
      
      {onRefresh ? (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["hsl(217, 71%, 22%)"]} // Android
              tintColor={"hsl(217, 71%, 22%)"} // iOS
            />
          }
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}