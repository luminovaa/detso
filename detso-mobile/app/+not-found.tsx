import React from 'react';
import { View, StatusBar } from 'react-native';
import { Link, Stack, usePathname } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '@/src/components/global/text';
import { Button } from '@/src/components/global/button';
import { useT } from '@/src/features/i18n/store';

export default function NotFoundScreen() {
  // 🔥 Mengambil path/URL spesifik yang tidak ditemukan
  const pathname = usePathname();
  const { t } = useT();

  return (
    <SafeAreaView className="flex-1 bg-background px-8 justify-center">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" backgroundColor="transparent" />

      {/* --- TOP ACCENT / SYSTEM STATUS --- */}
      <View className="absolute top-16 left-8 flex-row items-center bg-destructive/10 px-3 py-1.5 rounded-full border border-destructive/20">
        <View className="w-2 h-2 rounded-full bg-destructive mr-2 animate-pulse" />
        <Text weight="semibold" className="text-destructive text-[11px] tracking-wider uppercase">
          {t("notFound.badge")}
        </Text>
      </View>

      <View className="items-center w-full">
        {/* --- ICON 404 ALA SERVER DOWN --- */}
        <View className="w-28 h-28 rounded-[32px] bg-card items-center justify-center mb-8 border border-border shadow-sm">
          <Ionicons name="server-outline" size={48} color="#EF4444" />
          <View className="absolute bottom-6 right-6 bg-background rounded-full p-1">
            <Ionicons name="close-circle" size={20} color="#EF4444" />
          </View>
        </View>

        <Text weight="bold" className="text-4xl text-foreground text-center tracking-tight mb-2">
          {t("notFound.title")}
        </Text>
        
        <Text className="text-base text-muted-foreground text-center mb-8 leading-relaxed">
          {t("notFound.desc")}
        </Text>

        {/* --- TERMINAL DIAGNOSTIC LOG (TAMPILKAN PATH YANG SALAH) --- */}
        <View className="bg-[#0F172A] w-full p-5 rounded-2xl border border-slate-700/50 shadow-inner mb-10">
          <View className="flex-row items-center mb-3 border-b border-slate-700/50 pb-2">
            <Ionicons name="terminal-outline" size={14} color="#64748B" className="mr-2" />
            <Text weight="semibold" className="text-slate-400 text-[10px] tracking-widest uppercase">
              {t("notFound.logTitle")}
            </Text>
          </View>
          
          <Text className="text-emerald-400 text-xs font-mono leading-relaxed">
            {'>'} {t("notFound.logStart")}{'\n'}
            {'>'} {t("notFound.logTarget")} <Text weight="bold" className="text-amber-400">{pathname}</Text>{'\n'}
            {'>'} {t("notFound.logResolving")} <Text className="text-destructive">{t("notFound.logFailed")}</Text>{'\n'}
            {'>'} {t("notFound.logReason")}
          </Text>
        </View>

        <Link href="/" asChild>
          <Button 
            title={t("notFound.backBtn")} 
            variant="primary" 
            size="lg"
            className="w-full shadow-lg shadow-primary/20 h-14"
          />
        </Link>
        
      </View>
    </SafeAreaView>
  );
}
