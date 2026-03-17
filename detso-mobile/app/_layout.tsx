import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";

import "../global.css";
import { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { PortalProvider } from "@gorhom/portal";
import { ToastProvider, useToast } from "@/src/hooks/use-toast";
import { ToastViewport } from "@/src/components/global/toast";
import { authEvents } from "@/src/lib/auth-events";
import { ErrorBoundary } from "@/src/components/global/error-boundary";

SplashScreen.preventAutoHideAsync();

function GlobalLogic() {
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    // 1. Dengarkan jika Server Error (500)
    const unsubscribeServerError = authEvents.on("server_error", () => {
      toast({
        title: "Gangguan Server",
        description:
          "Server kami sedang mengalami kendala. Coba lagi dalam beberapa saat.",
        type: "destructive",
      });
    });

    // 2. Dengarkan jika Sesi Habis / Refresh Token Gagal
    const unsubscribeSessionExpired = authEvents.on("session_expired", () => {
      toast({
        title: "Sesi Habis",
        description: "Sesi login Anda telah berakhir. Silakan login kembali.",
        type: "warning",
      });
      // Arahkan paksa kembali ke layar login
      router.replace("/login");
    });

    // Jangan lupa bersihkan listener saat komponen dibongkar
    return () => {
      unsubscribeServerError();
      unsubscribeSessionExpired();
    };
  }, [toast, router]);

  return null; // Komponen ini tidak merender UI apa-apa, hanya logic
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    "SF-Pro-Regular": require("../assets/fonts/SF-Pro-Rounded-Regular.otf"),
    "SF-Pro-Medium": require("../assets/fonts/SF-Pro-Rounded-Medium.otf"),
    "SF-Pro-Semibold": require("../assets/fonts/SF-Pro-Rounded-Semibold.otf"),
    "SF-Pro-Bold": require("../assets/fonts/SF-Pro-Rounded-Bold.otf"),
    "SF-Pro-Heavy": require("../assets/fonts/SF-Pro-Rounded-Heavy.otf"),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <PortalProvider>
          <BottomSheetModalProvider>
            <ToastProvider>
              <GlobalLogic />
              <Stack>
                <Stack.Screen name="index" options={{ headerShown: false }} />
              </Stack>
              <ToastViewport />
            </ToastProvider>
          </BottomSheetModalProvider>
        </PortalProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
