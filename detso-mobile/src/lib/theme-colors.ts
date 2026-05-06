/**
 * Theme-Aware Color Utility
 * 
 * Provides a centralized way to access colors that automatically adapt to light/dark mode.
 * 
 * Usage:
 * ```typescript
 * import { useThemeColor } from '@/src/lib/theme-colors';
 * 
 * function MyComponent() {
 *   const colors = useThemeColor();
 *   
 *   return (
 *     <ActivityIndicator color={colors.primary} />
 *     <Ionicons name="alert" color={colors.error} />
 *     <TextInput placeholderTextColor={colors.textMuted} />
 *   );
 * }
 * ```
 * 
 * For non-React contexts (utils, services):
 * ```typescript
 * import { getThemeColors } from '@/src/lib/theme-colors';
 * 
 * const colors = getThemeColors('dark');
 * ```
 */

import { useColorScheme } from 'react-native';
import { COLORS, COLORS_DARK } from './colors';

export interface ThemeColors {
  // ─── Brand Colors ──────────────────────────────────────────────
  /** Primary brand color (teal) */
  primary: string;
  /** Secondary brand color (cyan) */
  secondary: string;
  /** Accent color (emerald) */
  accent: string;
  /** Tertiary/depth color */
  tertiary: string;

  // ─── Semantic Colors ───────────────────────────────────────────
  /** Success state color (green) */
  success: string;
  /** Warning state color (amber) */
  warning: string;
  /** Error/danger state color (red) */
  error: string;
  /** Info state color (blue) */
  info: string;

  // ─── Text Colors ───────────────────────────────────────────────
  /** Primary text color */
  text: string;
  /** Secondary/muted text color */
  textMuted: string;
  /** Disabled text color */
  textDisabled: string;
  /** Inverted text color (for colored backgrounds) */
  textInverted: string;

  // ─── Background Colors ─────────────────────────────────────────
  /** Main background color */
  background: string;
  /** Card/surface background color */
  card: string;
  /** Input background color */
  input: string;
  /** Hover/pressed state background */
  hover: string;

  // ─── Border Colors ─────────────────────────────────────────────
  /** Default border color */
  border: string;
  /** Input border color */
  borderInput: string;
  /** Focus border color */
  borderFocus: string;

  // ─── Icon Colors ───────────────────────────────────────────────
  /** Default icon color */
  icon: string;
  /** Active/selected icon color */
  iconActive: string;
  /** Muted/disabled icon color */
  iconMuted: string;

  // ─── Network Topology Colors ───────────────────────────────────
  /** Fiber optic line color */
  networkFiber: string;
  /** Drop cable line color */
  networkDropCable: string;
  /** Server node color */
  networkServer: string;
  /** ODP node color */
  networkOdp: string;
  /** Active service color */
  serviceActive: string;
  /** Inactive service color */
  serviceInactive: string;
  /** Suspended service color */
  serviceSuspended: string;

  // ─── Ticket Priority Colors ────────────────────────────────────
  /** Low priority ticket */
  priorityLow: string;
  /** Medium priority ticket */
  priorityMedium: string;
  /** High priority ticket */
  priorityHigh: string;
  /** Urgent priority ticket */
  priorityUrgent: string;

  // ─── Special Colors ────────────────────────────────────────────
  /** Shadow color (always black) */
  shadow: string;
  /** Overlay/backdrop color */
  overlay: string;
  /** Pure white (always) */
  white: string;
  /** Pure black (always) */
  black: string;
  /** Transparent */
  transparent: string;
}

/**
 * Get theme colors based on color scheme
 * @param colorScheme - 'light' or 'dark'
 * @returns Theme colors object
 */
export function getThemeColors(colorScheme: 'light' | 'dark'): ThemeColors {
  const isDark = colorScheme === 'dark';

  return {
    // Brand Colors
    primary: isDark ? COLORS.brand.primaryLight : COLORS.brand.primary,
    secondary: isDark ? COLORS.brand.secondaryLight : COLORS.brand.secondary,
    accent: isDark ? COLORS.brand.accentLight : COLORS.brand.accent,
    tertiary: isDark ? COLORS.brand.tertiaryLight : COLORS.brand.tertiary,

    // Semantic Colors
    success: isDark ? COLORS.status.successLight : COLORS.status.success,
    warning: isDark ? COLORS.status.warningLight : COLORS.status.warning,
    error: isDark ? COLORS.status.errorLight : COLORS.status.error,
    info: isDark ? COLORS.status.infoLight : COLORS.status.info,

    // Text Colors
    text: isDark ? COLORS.neutral.white : COLORS.neutral.gray[900],
    textMuted: isDark ? COLORS.neutral.gray[400] : COLORS.neutral.gray[500],
    textDisabled: isDark ? COLORS.neutral.gray[600] : COLORS.neutral.gray[400],
    textInverted: isDark ? COLORS.neutral.gray[900] : COLORS.neutral.white,

    // Background Colors
    background: isDark ? COLORS.neutral.gray[900] : COLORS.neutral.white,
    card: isDark ? COLORS.neutral.gray[800] : COLORS.neutral.white,
    input: isDark ? COLORS.neutral.gray[800] : COLORS.neutral.gray[100],
    hover: isDark ? COLORS.neutral.gray[700] : COLORS.neutral.gray[100],

    // Border Colors
    border: isDark ? COLORS.neutral.gray[700] : COLORS.neutral.gray[200],
    borderInput: isDark ? COLORS.neutral.gray[600] : COLORS.neutral.gray[300],
    borderFocus: isDark ? COLORS.brand.primaryLight : COLORS.brand.primary,

    // Icon Colors
    icon: isDark ? COLORS.neutral.gray[400] : COLORS.neutral.gray[500],
    iconActive: isDark ? COLORS.brand.primaryLight : COLORS.brand.primary,
    iconMuted: isDark ? COLORS.neutral.gray[600] : COLORS.neutral.gray[400],

    // Network Topology Colors (same in both themes for consistency)
    networkFiber: COLORS.network.fiberLine,
    networkDropCable: COLORS.network.dropCable,
    networkServer: COLORS.network.nodeServer,
    networkOdp: COLORS.network.nodeOdp,
    serviceActive: COLORS.network.serviceActive,
    serviceInactive: COLORS.network.serviceInactive,
    serviceSuspended: COLORS.network.serviceSuspended,

    // Ticket Priority Colors
    priorityLow: isDark ? COLORS_DARK.priority.low : COLORS.neutral.gray[500],
    priorityMedium: isDark ? COLORS_DARK.priority.medium : COLORS.priority.medium,
    priorityHigh: isDark ? COLORS_DARK.priority.high : COLORS.priority.high,
    priorityUrgent: isDark ? COLORS_DARK.priority.urgent : COLORS.priority.urgent,

    // Special Colors (always same)
    shadow: COLORS.neutral.black,
    overlay: 'rgba(0, 0, 0, 0.5)',
    white: COLORS.neutral.white,
    black: COLORS.neutral.black,
    transparent: 'transparent',
  };
}

/**
 * React hook to get theme-aware colors
 * Automatically updates when system theme changes
 * 
 * @returns Theme colors object
 * 
 * @example
 * ```typescript
 * function MyComponent() {
 *   const colors = useThemeColor();
 *   
 *   return (
 *     <View style={{ backgroundColor: colors.background }}>
 *       <Text style={{ color: colors.text }}>Hello</Text>
 *       <ActivityIndicator color={colors.primary} />
 *     </View>
 *   );
 * }
 * ```
 */
export function useThemeColor(): ThemeColors {
  const colorScheme = useColorScheme();
  return getThemeColors(colorScheme === 'dark' ? 'dark' : 'light');
}

/**
 * Helper to get rgba color with custom opacity
 * @param hexColor - Hex color string
 * @param opacity - Opacity value (0-1)
 * @returns rgba color string
 * 
 * @example
 * ```typescript
 * const colors = useThemeColor();
 * const semiTransparent = withOpacity(colors.primary, 0.5);
 * // Returns: 'rgba(15, 118, 110, 0.5)'
 * ```
 */
export function withOpacity(hexColor: string, opacity: number): string {
  // Remove # if present
  const hex = hexColor.replace('#', '');
  
  // Parse hex to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Helper to create shadow style object
 * @param color - Shadow color (default: black)
 * @param opacity - Shadow opacity (default: 0.1)
 * @param radius - Shadow radius (default: 4)
 * @param elevation - Android elevation (default: 3)
 * @returns Shadow style object
 * 
 * @example
 * ```typescript
 * const colors = useThemeColor();
 * <View style={[styles.card, createShadow(colors.shadow, 0.2, 8, 5)]}>
 * ```
 */
export function createShadow(
  color: string = '#000000',
  opacity: number = 0.1,
  radius: number = 4,
  elevation: number = 3
) {
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation, // Android
  };
}
