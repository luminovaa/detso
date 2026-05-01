import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Request, Response } from 'express';
import { log } from '../config/logger.config';

// Helper untuk mendapatkan identifier unik per user/IP
const getUserIdentifier = (req: Request): string => {
  // Jika user sudah login, gunakan user ID
  if (req.user?.id) {
    return `user:${req.user.id}`;
  }
  // Jika belum login, gunakan IP address dengan proper IPv6 handling
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  return `ip:${ipKeyGenerator(ip)}`;
};

// Handler ketika rate limit exceeded
const rateLimitHandler = (req: Request, res: Response) => {
  const identifier = getUserIdentifier(req);
  
  log.warn('Rate limit exceeded', {
    identifier,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });
  
  res.status(429).json({
    success: false,
    message: 'Terlalu banyak request. Silakan coba lagi nanti.',
    retryAfter: res.getHeader('Retry-After'),
  });
};

/**
 * Rate limiter untuk login endpoint
 * Hanya menghitung request yang GAGAL (status >= 400)
 * 5 kali gagal login = block 5 menit
 */
export const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 menit
  max: 5, // Max 5 percobaan gagal per 5 menit
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Hanya hitung yang gagal
  keyGenerator: (req) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return `auth:${ipKeyGenerator(ip)}`;
  },
  skip: (req) => {
    // Skip rate limit untuk refresh token, logout, verify, me, sessions
    return !req.path.includes('/login');
  },
  handler: (req: Request, res: Response) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';

    log.warn('Auth rate limit exceeded (brute force protection)', {
      ip,
      path: req.path,
      method: req.method,
    });

    res.status(429).json({
      success: false,
      message: 'Terlalu banyak percobaan login gagal. Silakan coba lagi dalam 5 menit.',
      retryAfter: res.getHeader('Retry-After'),
    });
  },
});

/**
 * Rate limiter untuk API umum (global)
 * Sangat longgar - hanya untuk mencegah abuse/DDoS
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 1000, // Max 1000 requests per 15 menit
  message: 'Terlalu banyak request. Silakan coba lagi nanti.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: getUserIdentifier,
});

/**
 * Rate limiter untuk operasi write (POST, PUT, DELETE)
 * Cukup longgar untuk operasi normal
 */
export const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 300, // Max 300 write operations per 15 menit
  message: 'Terlalu banyak operasi write. Silakan coba lagi nanti.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: getUserIdentifier,
  skip: (req) => {
    // Hanya apply untuk POST, PUT, DELETE, PATCH
    return !['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method);
  },
});

/**
 * Rate limiter untuk file upload
 * Lebih ketat karena resource-intensive
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 jam
  max: 50, // Max 50 uploads per jam
  message: 'Terlalu banyak upload file. Silakan coba lagi dalam 1 jam.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: getUserIdentifier,
});

/**
 * Rate limiter untuk endpoint public (tanpa auth)
 * Sedang - mencegah abuse dari anonymous users
 */
export const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100, // Max 100 requests per 15 menit
  message: 'Terlalu banyak request. Silakan coba lagi nanti.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => ipKeyGenerator(req.ip || req.connection.remoteAddress || 'unknown'),
});


