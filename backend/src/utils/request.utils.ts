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
