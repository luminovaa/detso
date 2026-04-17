/**
 * ABSOLUTE URL GENERATOR
 *
 * Utility function to convert relative paths into complete absolute URLs,
 * or return original URLs if they are already absolute.
 *
 * MAIN PURPOSE:
 * - Ensure all URLs sent to the client (e.g., in API responses, emails, redirects)
 *   are always in absolute format (e.g., `https://app.school.com/uploads/file.pdf`).
 * - Support integration with external services that may already send full URLs.
 *
 * COMMON USE CASES:
 * - Convert file storage paths: `/uploads/avatar.jpg` → `https://.../uploads/avatar.jpg`
 * - Handle OAuth callback URLs (e.g., Google Auth) that are already full URLs.
 * - Build links for notification emails, webhooks, or application deep links.
 *
 * CONFIGURATION NOTES:
 * - `BASE_URL` must be set in production environment variables (e.g., `https://app.school.com`).
 * - In development, falls back to `http://localhost:3000` (adjust port if needed).
 */

/**
 * Generates a complete absolute URL from a relative path.
 *
 * - If `null` or `undefined`: returns `null`.
 * - If starts with `http` (`http://` or `https://`): treats as external URL, returns as-is.
 * - If relative path (e.g., `/api/users`, `uploads/file.jpg`): joins with `BASE_URL`.
 *
 * @param path - The relative path or absolute URL to process
 * @returns Complete absolute URL or null if input was null/undefined
 *
 * @example
 * ```ts
 * // Assuming BASE_URL = 'https://app.school.com'
 * 
 * generateFullUrl('/uploads/photo.jpg');
 * // → 'https://app.school.com/uploads/photo.jpg'
 * 
 * generateFullUrl('uploads/photo.jpg');
 * // → 'https://app.school.com/uploads/photo.jpg'
 * 
 * generateFullUrl('https://google.com/auth/callback');
 * // → 'https://google.com/auth/callback' (unchanged)
 * 
 * generateFullUrl(null);
 * // → null
 * ```
 */
export const generateFullUrl = (path: string | null): string | null => {
  if (!path) return null;

  if (path.startsWith('http')) return path;

  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  return `${baseUrl}/${cleanPath}`;
};