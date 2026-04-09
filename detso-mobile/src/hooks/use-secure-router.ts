/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../features/auth/store';

/**
 * Custom React Hook for enforcing authentication-based navigation flows.
 * Automatically redirects users to the Login screen if they attempt to access protected routes without a valid session.
 * Also redirects authenticated users away from the Login screen to the main dashboard.
 *
 * @param fontsLoaded A boolean flag indicating whether the application's custom fonts have finished loading.
 */
export function useProtectedRoute(fontsLoaded: boolean) {
  const { user, isInitialized } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Halt redirection logic until the application's foundational states (fonts & auth) complete initialization
    if (!fontsLoaded || !isInitialized) return;

    const inAuthGroup = segments[0] === 'sign-in';

    const timeout = setTimeout(() => {
      if (!user && !inAuthGroup) {
        router.replace('/sign-in');
      } else if (user && inAuthGroup) {
        router.replace('/(tabs)');
      }
    }, 100);
    return () => clearTimeout(timeout);
  }, [user, isInitialized, fontsLoaded, segments]);
}