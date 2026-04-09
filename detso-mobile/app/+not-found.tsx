import React from 'react';
import { View, StatusBar } from 'react-native';
import { Link, Stack, usePathname } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '@/src/components/global/text';
import { Button } from '@/src/components/global/button';

export default function NotFoundScreen() {
  // 🔥 Mengambil path/URL spesifik yang tidak ditemukan
  const pathname = usePathname();

  return (
    <SafeAreaView className="flex-1 bg-background px-8 justify-center">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" backgroundColor="transparent" />

      {/* --- TOP ACCENT / SYSTEM STATUS --- */}
      <View className="absolute top-16 left-8 flex-row items-center bg-destructive/10 px-3 py-1.5 rounded-full border border-destructive/20">
        <View className="w-2 h-2 rounded-full bg-destructive mr-2 animate-pulse" />
        <Text weight="semibold" className="text-destructive text-[11px] tracking-wider uppercase">
          Koneksi Terputus
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
          404 Not Found
        </Text>
        
        <Text className="text-base text-muted-foreground text-center mb-8 leading-relaxed">
          Sistem gagal menemukan modul atau endpoint yang Anda minta. Rute mungkin telah dipindahkan atau Anda tidak memiliki akses.
        </Text>

        {/* --- TERMINAL DIAGNOSTIC LOG (TAMPILKAN PATH YANG SALAH) --- */}
        <View className="bg-[#0F172A] w-full p-5 rounded-2xl border border-slate-700/50 shadow-inner mb-10">
          <View className="flex-row items-center mb-3 border-b border-slate-700/50 pb-2">
            <Ionicons name="terminal-outline" size={14} color="#64748B" className="mr-2" />
            <Text weight="semibold" className="text-slate-400 text-[10px] tracking-widest uppercase">
              System Diagnostic Log
            </Text>
          </View>
          
          <Text className="text-emerald-400 text-xs font-mono leading-relaxed">
            {'>'} Memulai traceroute internal...{'\n'}
            {'>'} Target endpoint: <Text weight="bold" className="text-amber-400">{pathname}</Text>{'\n'}
            {'>'} Resolving route... <Text className="text-destructive">GAGAL</Text>{'\n'}
            {'>'} Reason: <Text className="text-slate-300">Packet dropped. Module does not exist in registry.</Text>
          </Text>
        </View>

        <Link href="/" asChild>
          <Button 
            title="Muat Ulang Koneksi (Kembali)" 
            variant="primary" 
            size="lg"
            className="w-full shadow-lg shadow-primary/20 h-14"
          />
        </Link>
        
      </View>
    </SafeAreaView>
  );
}