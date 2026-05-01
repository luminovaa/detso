import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { asyncHandler, AuthenticationError } from '../../utils/error-handler'
import { responseData } from '../../utils/response-handler'
import { prisma } from '../../utils/prisma'
import { generateAccessToken } from './login.auth'
import { generateFullUrl } from '../../utils/generate-full-url'
import { log } from '../../config/logger.config'

const REFRESH_TOKEN_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 days

export const refreshAccessToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!refreshToken) {
        throw new AuthenticationError('Refresh token tidak ditemukan');
    }

    // 1. Cari token record (termasuk yang sudah revoked untuk reuse detection)
    const tokenRecord = await prisma.detso_Refresh_Token.findFirst({
        where: {
            token: refreshToken,
        },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    role: true,
                    username: true,
                    phone: true,
                    tenant_id: true,
                    profile: {
                        select: { 
                            id: true, 
                            full_name: true,
                            avatar: true 
                        }
                    }
                }
            }
        }
    });

    if (!tokenRecord) {
        throw new AuthenticationError('Refresh token tidak valid');
    }

    // 2. TOKEN REUSE DETECTION
    // Jika token sudah pernah digunakan (last_used_at terisi) atau sudah revoked,
    // berarti ada yang mencoba menggunakan token lama → kemungkinan token dicuri
    if (tokenRecord.last_used_at || !tokenRecord.is_active || tokenRecord.revoked_at) {
        log.warn('Token reuse detected - revoking all user sessions', {
            userId: tokenRecord.user_id,
            tokenId: tokenRecord.id,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        // Revoke ALL sessions milik user ini
        await prisma.detso_Refresh_Token.updateMany({
            where: { user_id: tokenRecord.user_id, is_active: true },
            data: { 
                is_active: false, 
                revoked_at: new Date() 
            }
        });

        throw new AuthenticationError('Sesi tidak valid. Semua sesi telah dicabut demi keamanan. Silakan login kembali.');
    }

    // 3. Cek apakah token sudah expired
    if (tokenRecord.expires_at < new Date()) {
        throw new AuthenticationError('Refresh token sudah expired. Silakan login kembali.');
    }

    // 4. Generate new access token
    const newAccessToken = generateAccessToken({
        id: tokenRecord.user.id,
        email: tokenRecord.user.email,
        role: tokenRecord.user.role,
        tenant_id: tokenRecord.user.tenant_id
    });

    // 5. Generate new refresh token
    const newRefreshToken = crypto.randomBytes(40).toString('hex');

    // 6. TOKEN ROTATION: Revoke old token + create new token (atomic transaction)
    await prisma.$transaction([
        // Mark old token as used and revoke
        prisma.detso_Refresh_Token.update({
            where: { id: tokenRecord.id },
            data: { 
                last_used_at: new Date(),
                is_active: false,
                revoked_at: new Date()
            }
        }),
        // Create new rotated token
        prisma.detso_Refresh_Token.create({
            data: {
                user_id: tokenRecord.user_id,
                token: newRefreshToken,
                device_info: tokenRecord.device_info,
                ip_address: req.ip || req.connection.remoteAddress || tokenRecord.ip_address,
                user_agent: req.headers['user-agent'] || tokenRecord.user_agent,
                expires_at: new Date(Date.now() + REFRESH_TOKEN_EXPIRY),
                rotated_from: tokenRecord.id
            }
        })
    ]);

    log.info('Token rotated successfully', {
        userId: tokenRecord.user_id,
        oldTokenId: tokenRecord.id,
        deviceInfo: tokenRecord.device_info
    });

    // 7. Set cookies
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "strict" : "lax",
        maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "strict" : "lax",
        maxAge: REFRESH_TOKEN_EXPIRY,
    });

    // 8. Return response (cookie + body)
    const result = {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: '15m',
        user: {
            id: tokenRecord.user.id,
            email: tokenRecord.user.email,
            username: tokenRecord.user.username,
            role: tokenRecord.user.role,
            phone: tokenRecord.user.phone,
            profile: tokenRecord.user.profile ? {
                ...tokenRecord.user.profile,
                avatar: generateFullUrl(tokenRecord.user.profile.avatar)
            } : null,
            tenant_id: tokenRecord.user.tenant_id,
            exp: (jwt.decode(newAccessToken) as any).exp
        }
    };

    responseData(res, 200, 'Token berhasil diperbarui', result);
});

export const extractUserFromToken = asyncHandler(async (req: Request, res: Response, next: any) => {
    const token = req.cookies.accessToken;

    if (!token) {
        throw new AuthenticationError('Token tidak ditemukan');
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_TOKEN as string) as any;

        const user = await prisma.detso_User.findUnique({
            where: {
                id: decoded.id,
                deleted_at: null
            },
            select: {
                id: true,
                email: true,
                username: true,
                role: true,
                phone: true,
                tenant_id: true,
                profile: {
                    select: { 
                        id: true, 
                        full_name: true,
                        avatar: true 
                    }
                }
            }
        });

        if (!user) {
            throw new AuthenticationError('User tidak ditemukan');
        }

        // Normalize tenant_id: convert null to undefined to satisfy expected type
        req.user = {
            ...user,
            tenant_id: user.tenant_id
        };
        next();
    } catch (error) {
        throw new AuthenticationError('Token tidak valid');
    }
});

export const getCurrentUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.user;
    const token = req.cookies.accessToken;

    let exp = null;

    if (token) {
        try {
            const decoded = jwt.decode(token) as { exp?: number } | null;
            if (decoded && typeof decoded.exp === 'number') {
                exp = decoded.exp;
            }
        } catch (error) {
            console.warn('Gagal decode token untuk exp:', error);
        }
    }

    const responseDataWithExp = {
        ...user,
        profile: user?.profile ? {
            ...user?.profile,
            avatar: generateFullUrl(user?.profile.avatar!)
        } : null,
        exp: exp || null,
    };

    responseData(res, 200, 'User berhasil diambil', responseDataWithExp);
});

export const verifySession = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const token = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    if (!token && !refreshToken) {
        throw new AuthenticationError('Session tidak valid');
    }

    let isValid = false;
    let user = null;

    // 1. Cek access token dulu
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET_TOKEN as string) as any;
            user = await prisma.detso_User.findUnique({
                where: {
                    id: decoded.id,
                    deleted_at: null
                },
                select: {
                    id: true,
                    email: true,
                    username: true,
                    role: true,
                    tenant_id: true, // [NEW] WAJIB: Ambil tenant_id
                    profile: {
                        select: { 
                            id: true, 
                            full_name: true, 
                            avatar: true 
                        } 
                    }
                }
            });

            if (user) {
                isValid = true;
            }
        } catch (error) {
            // Access token invalid atau expired, lanjut ke refresh token
        }
    }

    // 2. Jika access token invalid, cek refresh token
    if (!isValid && refreshToken) {
        const tokenRecord = await prisma.detso_Refresh_Token.findFirst({
            where: {
                token: refreshToken,
                is_active: true,
                revoked_at: null,
                expires_at: {
                    gt: new Date()
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        username: true,
                        role: true,
                        tenant_id: true, // [NEW] WAJIB: Ambil tenant_id
                        profile: {
                            select: { id: true, full_name: true, avatar: true }
                        }
                    }
                }
            }
        });

        if (tokenRecord) {
            isValid = true;
            user = {
                ...tokenRecord.user,
                profile: tokenRecord.user.profile ? {
                    ...tokenRecord.user.profile,
                    avatar: generateFullUrl(tokenRecord.user.profile.avatar)
                } : null
            };
        }
    }

    if (!isValid || !user) {
        throw new AuthenticationError('Session tidak valid');
    }

    responseData(res, 200, 'Session valid', {
        isValid: true,
        user: {
            ...user,
            profile: user.profile ? {
                ...user.profile,
                avatar: generateFullUrl(user.profile.avatar)
            } : null
        }
    });
});