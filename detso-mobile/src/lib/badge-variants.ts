/**
 * Badge Color Variants
 * 
 * Centralized color system for badges, pills, and status indicators.
 * Uses Tailwind CSS classes for consistency across the app.
 * 
 * Each variant includes:
 * - bg: Background color (with opacity)
 * - border: Border color (with opacity)
 * - text: Text color
 * 
 * Usage:
 * ```tsx
 * import { badgeVariants } from '@/lib/badge-variants';
 * 
 * const colors = badgeVariants.success;
 * <View className={colors.bg + ' ' + colors.border}>
 *   <Text className={colors.text}>Active</Text>
 * </View>
 * ```
 */

export interface BadgeColorVariant {
  bg: string;
  border: string;
  text: string;
  textDark?: string; // Optional dark mode text color
}

export const badgeVariants = {
  // Status colors
  success: {
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    text: "text-green-600",
    textDark: "dark:text-green-400",
  },
  
  error: {
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    text: "text-red-600",
    textDark: "dark:text-red-400",
  },
  
  warning: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    text: "text-amber-600",
    textDark: "dark:text-amber-400",
  },
  
  info: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    text: "text-blue-600",
    textDark: "dark:text-blue-400",
  },
  
  // Neutral colors
  neutral: {
    bg: "bg-gray-500/10",
    border: "border-gray-500/20",
    text: "text-gray-600",
    textDark: "dark:text-gray-400",
  },
  
  // Additional semantic colors
  primary: {
    bg: "bg-primary/10",
    border: "border-primary/20",
    text: "text-primary",
  },
  
  secondary: {
    bg: "bg-secondary",
    border: "border-transparent",
    text: "text-secondary-foreground",
  },
  
  // Extended color palette
  purple: {
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    text: "text-purple-600",
    textDark: "dark:text-purple-400",
  },
  
  pink: {
    bg: "bg-pink-500/10",
    border: "border-pink-500/20",
    text: "text-pink-600",
    textDark: "dark:text-pink-400",
  },
  
  indigo: {
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
    text: "text-indigo-600",
    textDark: "dark:text-indigo-400",
  },
  
  teal: {
    bg: "bg-teal-500/10",
    border: "border-teal-500/20",
    text: "text-teal-600",
    textDark: "dark:text-teal-400",
  },
  
  orange: {
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    text: "text-orange-600",
    textDark: "dark:text-orange-400",
  },
  
  cyan: {
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    text: "text-cyan-600",
    textDark: "dark:text-cyan-400",
  },
  
  lime: {
    bg: "bg-lime-500/10",
    border: "border-lime-500/20",
    text: "text-lime-600",
    textDark: "dark:text-lime-400",
  },
  
  emerald: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    text: "text-emerald-600",
    textDark: "dark:text-emerald-400",
  },
  
  sky: {
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
    text: "text-sky-600",
    textDark: "dark:text-sky-400",
  },
  
  violet: {
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    text: "text-violet-600",
    textDark: "dark:text-violet-400",
  },
  
  fuchsia: {
    bg: "bg-fuchsia-500/10",
    border: "border-fuchsia-500/20",
    text: "text-fuchsia-600",
    textDark: "dark:text-fuchsia-400",
  },
  
  rose: {
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    text: "text-rose-600",
    textDark: "dark:text-rose-400",
  },
} as const;

export type BadgeVariantKey = keyof typeof badgeVariants;

/**
 * Helper function to get full text class with dark mode support
 */
export function getBadgeTextClass(variant: BadgeVariantKey): string {
  const colors = badgeVariants[variant] as BadgeColorVariant;
  return colors.textDark ? `${colors.text} ${colors.textDark}` : colors.text;
}

/**
 * Helper function to get all classes for a badge variant
 */
export function getBadgeClasses(variant: BadgeVariantKey): string {
  const colors = badgeVariants[variant];
  return `${colors.bg} ${colors.border}`;
}
