import React, { useEffect } from 'react';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';
import { View } from 'react-native';
import { useThemeStore } from '@/src/features/theme/store';

/**
 * ThemeSyncer: komponen internal yang hanya sync Zustand store → NativeWind.
 * Dipisah agar setColorScheme tidak memicu re-render pada parent View
 * yang membungkus NavigationContainer / Stack.
 */
function ThemeSyncer() {
  const { theme } = useThemeStore();
  const { setColorScheme } = useNativeWindColorScheme();

  useEffect(() => {
    // NativeWind's setColorScheme menerima "light" | "dark" | "system".
    // Passing "system" akan memanggil Appearance.setColorScheme(null)
    // yang mengembalikan kontrol ke preferensi OS/device.
    setColorScheme(theme);
  }, [theme, setColorScheme]);

  return null;
}

/**
 * ThemeProvider: wrapper stabil yang tidak re-render saat theme berubah.
 * setColorScheme dari NativeWind mengupdate global observable secara internal,
 * jadi tidak perlu className="dark" di wrapper View.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flex: 1 }}>
      <ThemeSyncer />
      {children}
    </View>
  );
}
