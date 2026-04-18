import React, { useEffect } from 'react';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';
import { useColorScheme as useDeviceColorScheme, View } from 'react-native';
import { useThemeStore } from '@/src/features/theme/store';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeStore();
  const deviceColorScheme = useDeviceColorScheme();
  const { setColorScheme, colorScheme } = useNativeWindColorScheme();

  useEffect(() => {
    const activeScheme = theme === 'system' ? deviceColorScheme : theme;
    setColorScheme(activeScheme === 'dark' ? 'dark' : 'light');
  }, [theme, deviceColorScheme, setColorScheme]);

  return (
    <View style={{ flex: 1 }} className={colorScheme === 'dark' ? 'dark' : ''}>
      {children}
    </View>
  );
}
