/**
 * PHONE NUMBER UTILITIES
 * 
 * Utilities for phone number normalization and formatting
 */

/**
 * Normalize phone number to include country code
 * 
 * Rules:
 * - If starts with +62 or 62: already has country code, return as-is
 * - If starts with 0: replace with +62
 * - Otherwise: prepend +62
 * 
 * @param phone - Phone number to normalize
 * @param countryCode - Country code (default: '62' for Indonesia)
 * @returns Normalized phone number with country code
 * 
 * @example
 * ```ts
 * normalizePhoneNumber('081234567890') // → '+62812345678'
 * normalizePhoneNumber('62812345678')  // → '+62812345678'
 * normalizePhoneNumber('+62812345678') // → '+62812345678'
 * normalizePhoneNumber('812345678')    // → '+62812345678'
 * ```
 */
export const normalizePhoneNumber = (phone: string, countryCode: string = '62'): string => {
  if (!phone) return '';

  // Remove all whitespace and special characters except + and digits
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');

  // Already has + prefix with country code
  if (cleaned.startsWith(`+${countryCode}`)) {
    return cleaned;
  }

  // Has country code without + prefix
  if (cleaned.startsWith(countryCode)) {
    return `+${cleaned}`;
  }

  // Starts with 0 (local format)
  if (cleaned.startsWith('0')) {
    return `+${countryCode}${cleaned.slice(1)}`;
  }

  // No country code at all
  return `+${countryCode}${cleaned}`;
};

/**
 * Generate WhatsApp URL for a phone number
 * 
 * @param phone - Phone number (will be normalized)
 * @param message - Optional pre-filled message
 * @returns WhatsApp URL
 * 
 * @example
 * ```ts
 * getWhatsAppUrl('081234567890') 
 * // → 'whatsapp://send?phone=62812345678'
 * 
 * getWhatsAppUrl('081234567890', 'Hello!')
 * // → 'whatsapp://send?phone=62812345678&text=Hello!'
 * ```
 */
export const getWhatsAppUrl = (phone: string, message?: string): string => {
  const normalized = normalizePhoneNumber(phone);
  // Remove + for WhatsApp URL format
  const phoneNumber = normalized.replace('+', '');
  
  let url = `whatsapp://send?phone=${phoneNumber}`;
  if (message) {
    url += `&text=${encodeURIComponent(message)}`;
  }
  
  return url;
};

/**
 * Generate tel: URL for phone dialer
 * 
 * @param phone - Phone number
 * @returns tel: URL
 * 
 * @example
 * ```ts
 * getTelUrl('081234567890') // → 'tel:081234567890'
 * ```
 */
export const getTelUrl = (phone: string): string => {
  return `tel:${phone}`;
};
