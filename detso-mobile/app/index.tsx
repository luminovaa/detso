// app/index.tsx
import { Redirect } from 'expo-router';

export default function Index() {
  // Secara default arahkan ke login
  // Nanti checkAuth di _layout.tsx akan memindahkan ke (tabs) jika sudah login
  return <Redirect href="/sign-in" />;
}