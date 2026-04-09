// src/features/i18n/store.ts
import { I18n } from "i18n-js";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import en from "@/src/locales/en.json";
import id from "@/src/locales/id.json";

const LANG_KEY = "app_language";

const i18n = new I18n({ en, id });
i18n.enableFallback = true;
i18n.defaultLocale = "en";

type Locale = "en" | "id";

interface LanguageState {
  locale: Locale;
  i18n: I18n;
  setLocale: (locale: Locale) => Promise<void>;
  loadLocale: () => Promise<void>;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  locale: "en",
  i18n,

  loadLocale: async () => {
    // 1. Cek AsyncStorage dulu
    const saved = await AsyncStorage.getItem(LANG_KEY);
    if (saved === "en" || saved === "id") {
      i18n.locale = saved;
      set({ locale: saved });
      return;
    }
    // 2. Fallback ke bahasa device
    const deviceLang = Localization.getLocales()[0]?.languageCode ?? "en";
    const locale: Locale = deviceLang === "id" ? "id" : "en";
    i18n.locale = locale;
    set({ locale });
  },

  setLocale: async (locale: Locale) => {
    i18n.locale = locale;
    await AsyncStorage.setItem(LANG_KEY, locale);
    set({ locale });
  },
}));

// Hook shortcut untuk terjemahan 
export const useT = () => {
  // Ambil locale terbaru dari Zustand
  const locale = useLanguageStore((s) => s.locale);

  return {
    // Paksa fungsi 't' untuk selalu membaca dari locale Zustand, 
    // bukan dari memori internal i18n-js!
    t: (key: string, options?: Record<string, any>) => 
      i18n.t(key, { locale, ...options }),
  };
};