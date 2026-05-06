/**
 * Encryption Utility for Mikrotik Passwords
 * 
 * Uses AES-256-GCM for secure password encryption
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

// Get encryption key from environment or generate a default (NOT for production!)
const getEncryptionKey = (): Buffer => {
  const key = process.env.MIKROTIK_ENCRYPTION_KEY;
  
  if (!key) {
    // WARNING: This is NOT secure for production!
    // Generate a proper key with: openssl rand -base64 32
    console.warn('⚠️  MIKROTIK_ENCRYPTION_KEY not set! Using default key (NOT SECURE!)');
    // Create a 32-byte key from a string
    return Buffer.from('default-insecure-key-change!!!!!'); // Exactly 32 bytes
  }
  
  // Convert base64 key to buffer
  return Buffer.from(key, 'base64');
};

/**
 * Encrypt a password
 * 
 * @param password - Plain text password
 * @returns Encrypted string in format: iv:authTag:encrypted
 */
export function encryptPassword(password: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(password, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Format: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt a password
 * 
 * @param encryptedPassword - Encrypted string in format: iv:authTag:encrypted
 * @returns Plain text password
 */
export function decryptPassword(encryptedPassword: string): string {
  try {
    const key = getEncryptionKey();
    const parts = encryptedPassword.split(':');
    
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted password format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error(`Failed to decrypt password: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if a string is encrypted
 * 
 * @param value - String to check
 * @returns true if encrypted, false otherwise
 */
export function isEncrypted(value: string): boolean {
  const parts = value.split(':');
  return parts.length === 3 && parts.every(part => /^[0-9a-f]+$/i.test(part));
}

/**
 * Generate a secure encryption key (for setup)
 * 
 * @returns Base64 encoded 32-byte key
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('base64');
}
