/**
 * Centralized Color Constants for DTS ISP Mobile App
 * 
 * This file provides color constants for use in contexts where Tailwind CSS
 * classes cannot be used (e.g., Mapbox styles, inline styles, third-party libraries).
 * 
 * For regular components, prefer using Tailwind semantic classes:
 * - bg-primary, text-primary, border-primary, etc.
 * 
 * Usage:
 * ```typescript
 * import { COLORS, getColor } from '@/src/lib/colors';
 * 
 * // Direct usage
 * const color = COLORS.network.fiberLine;
 * 
 * // Theme-aware usage
 * const color = getColor('brand.primary', isDark);
 * ```
 */

export const COLORS = {
  // ─── Brand Colors ──────────────────────────────────────────────
  brand: {
    /** Primary brand color - DTS Navy (#102E60) */
    primary: '#102E60',
    /** Primary for dark mode - Royal Blue (#2563EB) */
    primaryLight: '#2563EB',
    /** Secondary brand color - Steel Blue (#415F8B) */
    secondary: '#415F8B',
    /** Secondary for dark mode - Blue-400 (#60A5FA) */
    secondaryLight: '#60A5FA',
    /** Accent color - Emerald (emerald-500) */
    accent: '#10B981',
    /** Accent for dark mode - Light Emerald (emerald-400) */
    accentLight: '#34D399',
    /** Tertiary/depth - Very Dark Navy */
    tertiary: '#0A1E40',
    /** Tertiary light - Very Light Blue (blue-50) */
    tertiaryLight: '#EFF6FF',
  },

  // ─── Network Topology Colors ───────────────────────────────────
  network: {
    /** Fiber optic lines - Blue (blue-500) */
    fiberLine: '#3B82F6',
    /** Drop cable lines - Sky Cyan (cyan-400) */
    dropCable: '#22D3EE',
    /** Server node markers - DTS Navy */
    nodeServer: '#102E60',
    /** ODP node markers - Royal Blue */
    nodeOdp: '#2563EB',
    /** Active service markers - Emerald (emerald-500) */
    serviceActive: '#10B981',
    /** Inactive service markers - Red (red-500) */
    serviceInactive: '#EF4444',
    /** Suspended service markers - Amber (amber-500) */
    serviceSuspended: '#F59E0B',
  },

  // ─── Status Colors ─────────────────────────────────────────────
  status: {
    /** Success state - Emerald (emerald-500) */
    success: '#10B981',
    /** Success dark mode - Light Emerald (emerald-400) */
    successLight: '#34D399',
    /** Warning state - Amber (amber-500) */
    warning: '#F59E0B',
    /** Warning dark mode - Light Amber (amber-400) */
    warningLight: '#FBB040',
    /** Error state - Red (red-500) */
    error: '#EF4444',
    /** Error dark mode - Light Red (red-400) */
    errorLight: '#F87171',
    /** Info state - Cyan (cyan-500) */
    info: '#06B6D4',
    /** Info dark mode - Light Cyan (cyan-400) */
    infoLight: '#22D3EE',
  },

  // ─── Neutral Colors ────────────────────────────────────────────
  neutral: {
    /** Pure white */
    white: '#FFFFFF',
    /** Pure black */
    black: '#000000',
    /** Transparent */
    transparent: 'transparent',
    gray: {
      /** Slate-100 */
      100: '#F1F5F9',
      /** Slate-200 */
      200: '#E2E8F0',
      /** Slate-300 */
      300: '#CBD5E1',
      /** Slate-400 */
      400: '#94A3B8',
      /** Slate-500 */
      500: '#64748B',
      /** Slate-600 */
      600: '#475569',
      /** Slate-700 */
      700: '#334155',
      /** Slate-800 */
      800: '#1E293B',
      /** Slate-900 */
      900: '#0F172A',
    },
  },

  // ─── Map-Specific Colors ───────────────────────────────────────
  map: {
    /** Label text color */
    labelText: '#FFFFFF',
    /** Label halo/outline color */
    labelHalo: '#000000',
    /** Marker stroke color */
    markerStroke: '#FFFFFF',
    /** User location puck color */
    userLocation: '#3B82F6', // blue-500
  },

  // ─── Priority Colors (for tickets, tasks, etc.) ────────────────
  priority: {
    /** Low priority - Gray */
    low: '#94A3B8', // slate-400
    /** Medium priority - DTS Navy */
    medium: '#102E60',
    /** High priority - Amber */
    high: '#F59E0B', // amber-500
    /** Urgent priority - Red */
    urgent: '#EF4444', // red-500
  },
} as const;

/**
 * Dark mode color variants
 * Use these when explicitly in dark mode context
 */
export const COLORS_DARK = {
  brand: {
    primary: '#2563EB', // blue-600
    secondary: '#60A5FA', // blue-400
    accent: '#34D399', // emerald-400
  },
  status: {
    success: '#34D399', // emerald-400
    warning: '#FBB040', // amber-400
    error: '#F87171', // red-400
    info: '#22D3EE', // cyan-400
  },
  priority: {
    low: '#CBD5E1', // slate-300
    medium: '#3B82F6', // blue-500
    high: '#FBB040', // amber-400
    urgent: '#F87171', // red-400
  },
} as const;

/**
 * Helper function to get color based on theme
 * 
 * @param path - Dot-notation path to color (e.g., 'brand.primary', 'network.fiberLine')
 * @param isDark - Whether dark mode is active
 * @returns Hex color string
 * 
 * @example
 * ```typescript
 * const color = getColor('brand.primary', isDark);
 * // Returns '#0F766E' in light mode, '#2DD4BF' in dark mode
 * ```
 */
export function getColor(path: string, isDark: boolean = false): string {
  const keys = path.split('.');
  
  // Try dark mode colors first if isDark is true
  if (isDark) {
    let darkValue: any = COLORS_DARK;
    let foundInDark = true;
    
    for (const key of keys) {
      if (darkValue?.[key] !== undefined) {
        darkValue = darkValue[key];
      } else {
        foundInDark = false;
        break;
      }
    }
    
    if (foundInDark && typeof darkValue === 'string') {
      return darkValue;
    }
  }
  
  // Fallback to light mode colors
  let value: any = COLORS;
  for (const key of keys) {
    if (value?.[key] !== undefined) {
      value = value[key];
    } else {
      console.warn(`Color path "${path}" not found, returning black`);
      return '#000000';
    }
  }
  
  if (typeof value === 'string') {
    return value;
  }
  
  console.warn(`Color path "${path}" does not resolve to a color string, returning black`);
  return '#000000';
}

/**
 * Helper to get rgba color with opacity
 * 
 * @param hexColor - Hex color string (e.g., '#0F766E')
 * @param opacity - Opacity value between 0 and 1
 * @returns rgba color string
 * 
 * @example
 * ```typescript
 * const color = hexToRgba('#0F766E', 0.15);
 * // Returns 'rgba(15, 118, 110, 0.15)'
 * ```
 */
export function hexToRgba(hexColor: string, opacity: number): string {
  // Remove # if present
  const hex = hexColor.replace('#', '');
  
  // Parse hex to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Clamp opacity between 0 and 1
  const alpha = Math.max(0, Math.min(1, opacity));
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Helper to convert hex to rgb
 * 
 * @param hexColor - Hex color string (e.g., '#0F766E')
 * @returns rgb color string
 * 
 * @example
 * ```typescript
 * const color = hexToRgb('#0F766E');
 * // Returns 'rgb(15, 118, 110)'
 * ```
 */
export function hexToRgb(hexColor: string): string {
  return hexToRgba(hexColor, 1).replace('rgba', 'rgb').replace(', 1)', ')');
}
