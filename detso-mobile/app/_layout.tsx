import React, { useEffect, useRef } from "react";
import { AppState, AppStateStatus, BackHandler, Platform, ToastAndroid } from "react-native";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
// import "@/src/lib/i18n";

// UI Providers
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { PortalProvider } from "@gorhom/portal";
import { useLanguageStore } from "@/src/features/i18n/store";

// Global & Utils
import "../global.css";
import { ErrorBoundary } from "@/src/components/global/error-boundary";
import { authEvents } from "@/src/lib/auth-events";
import { ThemeProvider } from "@/src/components/global/theme-provider";

// Auth & Security
import { useAuthStore } from "@/src/features/auth/store"; // Sesuaikan path jika berbeda
import { useProtectedRoute } from "@/src/hooks/use-secure-router";
import { showToast, ToastProvider } from "@/src/components/global/toast";

// Tahan splash screen bawaan OS agar tidak hilang duluan
SplashScreen.preventAutoHideAsync();

// ==========================================
// 1. KOMPONEN GLOBAL LOGIC (Untuk Toast Event)
// ==========================================
function GlobalLogic() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribeServerError = authEvents.on("server_error", () => {
     showToast.error(
        "Gangguan Server", 
        "Server kami sedang mengalami kendala. Coba lagi dalam beberapa saat."
      );
    });

    const unsubscribeSessionExpired = authEvents.on("session_expired", () => {
      showToast.warning(
        "Sesi Habis", 
        "Sesi login Anda telah berakhir. Silakan login kembali."
      );
      router.replace("/sign-in");
    });

    return () => {
      unsubscribeServerError();
      unsubscribeSessionExpired();
    };
  }, [router]);

  return null;
}

// ==========================================
// 2. ROOT LAYOUT UTAMA
// ==========================================
export default function RootLayout() {
  const router = useRouter();
  const backPressTimeRef = useRef(0);
  const appState = useRef(AppState.currentState);
const loadLocale = useLanguageStore((s) => s.loadLocale);

  // Ambil state dan fungsi dari Zustand Store
  const { checkAuth, isInitialized, setupAutoRefresh, clearAutoRefresh } = useAuthStore();

  // Load Font
  const [fontsLoaded, fontError] = useFonts({
    "SF-Pro-Regular": require("../assets/fonts/SF-Pro-Rounded-Regular.otf"),
    "SF-Pro-Medium": require("../assets/fonts/SF-Pro-Rounded-Medium.otf"),
    "SF-Pro-Semibold": require("../assets/fonts/SF-Pro-Rounded-Semibold.otf"),
    "SF-Pro-Bold": require("../assets/fonts/SF-Pro-Rounded-Bold.otf"),
    "SF-Pro-Heavy": require("../assets/fonts/SF-Pro-Rounded-Heavy.otf"),
  });

  // --- EFEK 1: Inisialisasi Auth saat pertama buka aplikasi ---
  useEffect(() => {
    checkAuth();
    loadLocale();
  }, []);

  // --- EFEK 2: Pantau Background/Foreground Aplikasi (Auto Refresh Token) ---
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      const prev = appState.current;
      appState.current = nextAppState;
      // Jika aplikasi baru saja dibuka kembali dari background
      if (prev.match(/inactive|background/) && nextAppState === "active") {
        const currentTimer = useAuthStore.getState().refreshTimer;
        // Nyalakan ulang timer jika mati
        if (!currentTimer) setupAutoRefresh();
      }
    };
    
    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => {
      subscription.remove();
      clearAutoRefresh(); // Bersihkan memori saat aplikasi benar-benar ditutup
    };
  }, []);

  // --- EFEK 3: Double Tap to Exit (Fitur UX Android Premium) ---
  useEffect(() => {
    const onBackPress = () => {
      // Jika masih ada riwayat halaman, biarkan user kembali ke halaman sebelumnya
      if (router.canGoBack()) {
        return false;
      }

      // Jika user menekan back 2x dalam 2 detik, keluar aplikasi
      const now = Date.now();
      if (now - backPressTimeRef.current < 2000) {
        BackHandler.exitApp();
        return true;
      }

      backPressTimeRef.current = now;
      if (Platform.OS === "android") {
        ToastAndroid.show("Tekan sekali lagi untuk keluar", ToastAndroid.SHORT);
      }
      return true; // Tahan agar aplikasi tidak langsung tertutup
    };

    const backHandler = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => backHandler.remove();
  }, [router]);

  // --- PENGATURAN KESIAPAN APLIKASI ---
  // Aplikasi dianggap "Ready" jika font selesai diunduh DAN token JWT selesai dicek
  const isAppReady = fontsLoaded && isInitialized;

  // Jalankan perlindungan rute (Redirect ke Login jika belum auth)
  useProtectedRoute(isAppReady);

  // Sembunyikan Splash Screen bawaan OS hanya jika aplikasi sudah benar-benar siap
  useEffect(() => {
    if (isAppReady || fontError) {
      SplashScreen.hideAsync();
    }
  }, [isAppReady, fontError]);

  // Tahan layar hitam/putih (Native Splash) selama isAppReady masih false
  if (!isAppReady && !fontError) {
    return null; 
  }

  // --- RENDER SEMUA PROVIDER ---
  return (
    <ThemeProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ErrorBoundary>
          <PortalProvider>
            <BottomSheetModalProvider>
              <ToastProvider>
                <GlobalLogic />
                <Stack screenOptions={{ headerShown: false }} />
              </ToastProvider>
            </BottomSheetModalProvider>
          </PortalProvider>
        </ErrorBoundary>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}