/**
 * Utility functions untuk type-safe extraction dari Express Request objects.
 * 
 * Mengatasi breaking change di @types/express v5 dimana req.params
 * bertipe `string | string[]` bukan lagi `string`.
 */

/**
 * Mengambil single string value dari request parameter.
 * Jika value berupa array, ambil element pertama.
 * 
 * @param value - Value dari req.params atau req.query (bisa string | string[] | undefined)
 * @returns string value, atau empty string jika undefined/null
 * 
 * @example
 * const customerId = getParam(req.params.id);
 * const sessionId = getParam(req.params.sessionId);
 */
export const getParam = (value: string | string[] | undefined | null): string => {
  if (value === undefined || value === null) {
    return '';
  }
  if (Array.isArray(value)) {
    return value[0] || '';
  }
  return value;
};

/**
 * Normalizes optional string inputs to trimmed non-empty string or null.
 */
export const trimOrNull = (value?: string | null): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};
