/**
 * SIGNED URL GENERATOR
 *
 * Utility to generate temporary signed URLs for secure file access.
 * Uses JWT to sign URLs with expiration time.
 *
 * MAIN PURPOSE:
 * - Generate time-limited URLs for PDF documents and other sensitive files
 * - Prevent unauthorized access to files by requiring valid signature
 * - Automatically expire URLs after specified duration
 *
 * SECURITY NOTES:
 * - Uses JWT_SECRET from environment variables for signing
 * - Default expiry: 3 minutes (180 seconds)
 * - Signature includes file path to prevent URL tampering
 */

import jwt from 'jsonwebtoken';
import { generateFullUrl } from './generate-full-url';

interface SignedUrlPayload {
  path: string;
  exp: number;
}

/**
 * Generate a signed URL with expiration
 * 
 * @param relativePath - Relative path to the file (e.g., 'storage/public/customer/documents/file.pdf')
 * @param expirySeconds - Expiration time in seconds (default: 180 = 3 minutes)
 * @returns Signed URL with token query parameter
 * 
 * @example
 * ```ts
 * const signedUrl = generateSignedUrl('storage/public/customer/documents/file.pdf', 180);
 * // → 'https://app.com/api/files/signed?token=eyJhbGc...'
 * ```
 */
export const generateSignedUrl = (relativePath: string, expirySeconds: number = 180): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }

  const payload: SignedUrlPayload = {
    path: relativePath,
    exp: Math.floor(Date.now() / 1000) + expirySeconds
  };

  const token = jwt.sign(payload, secret);
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  
  return `${baseUrl}/api/files/signed?token=${token}`;
};

/**
 * Verify and decode a signed URL token
 * 
 * @param token - JWT token from URL query parameter
 * @returns Decoded payload with file path
 * @throws Error if token is invalid or expired
 * 
 * @example
 * ```ts
 * const payload = verifySignedUrl(token);
 * // → { path: 'storage/public/customer/documents/file.pdf', exp: 1234567890 }
 * ```
 */
export const verifySignedUrl = (token: string): SignedUrlPayload => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }

  try {
    const decoded = jwt.verify(token, secret) as SignedUrlPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Signed URL has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid signed URL token');
    }
    throw error;
  }
};
