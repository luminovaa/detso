// app/index.tsx
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/src/features/auth/store';

export default function Index() {
  const user = useAuthStore((s) => s.user);

  // Jika sudah login, langsung ke dashboard
  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  // Belum login, arahkan ke login
  return <Redirect href="/sign-in" />;
}