import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Tinggi visual tab bar (container) */
export const TAB_BAR_HEIGHT = 70;

/** Jarak minimum dari bawah layar ke tab bar */
const TAB_BAR_MARGIN = 16;

/**
 * Hook untuk menghitung tinggi total area tab bar (termasuk jarak bawah).
 * Digunakan agar konten screen tidak tertutup floating tab bar.
 *
 * - Gesture navigation (insets.bottom > 0): tab bar di atas gesture bar
 * - 3-button navigation (insets.bottom === 0): tab bar floating dengan margin
 *
 * @returns
 * - `tabBarBottom` — nilai `bottom` untuk posisi tab bar
 * - `contentPaddingBottom` — padding yang harus ditambahkan ke konten screen
 * - `fabBottom` — posisi `bottom` yang aman untuk FAB button
 */
export function useTabBarHeight() {
  const insets = useSafeAreaInsets();

  // Posisi bottom tab bar
  // Gesture nav: tepat di atas gesture bar + sedikit margin
  // 3-button nav: floating dengan margin dari bawah
  const tabBarBottom = insets.bottom > 0
    ? insets.bottom + 4  // gesture nav: sedikit di atas gesture bar
    : TAB_BAR_MARGIN;    // 3-button nav: 16px dari bawah

  // Total ruang yang ditempati tab bar dari bawah layar
  const totalTabBarSpace = tabBarBottom + TAB_BAR_HEIGHT;

  // Padding bottom untuk konten agar tidak tertutup tab bar
  // Tambah 16px extra breathing room
  const contentPaddingBottom = totalTabBarSpace + 16;

  // Posisi FAB button (di atas tab bar + jarak)
  const fabBottom = totalTabBarSpace + 12;

  return {
    tabBarBottom,
    contentPaddingBottom,
    fabBottom,
    insets,
  };
}
