/** Structure defining the expected payloads enclosed within the platform's JSON Web Tokens. */
export interface JWTPayload {
  id: string;
  email: string;
  role: string;
  tenant_id: string | null;
  iat: number;
  exp: number;
}

/**
 * Decodes a JSON Web Token payload asynchronously strictly on the client-side without cryptographic verification.
 * Intended primarily for reading expiration epochs and role extraction. Do not use for security validation.
 *
 * @param token The raw base64-encoded JWT string.
 * @returns The parsed `JWTPayload` object or `null` if malformed.
 */
export const decodeJWT = (token: string): JWTPayload | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    // Base64 decoding robust enough for React Native/Hermes
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(base64);
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
};

/**
 * Evaluates whether a provided JWT token has passed its expiration epoch.
 * Treats malformed or undecodable tokens as immediately expired.
 *
 * @param token The raw JWT string to evaluate.
 * @returns `true` if expired or invalid, `false` if still active.
 */
export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeJWT(token);
  if (!decoded) return true;

  const now = Math.floor(Date.now() / 1000);
  return decoded.exp < now;
};

/**
 * Calculates the remaining time-to-live (TTL) for an active JWT token in seconds.
 *
 * @param token The raw JWT string to check.
 * @returns Remaining lifespan in seconds, or `0` if expired/invalid.
 */
export const getSecondsUntilExpiry = (token: string): number => {
  const decoded = decodeJWT(token);
  if (!decoded) return 0;

  const now = Math.floor(Date.now() / 1000);
  return decoded.exp - now;
};