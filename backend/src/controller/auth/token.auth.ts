import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { asyncHandler, AuthenticationError } from '../../utils/error-handler'
import { responseData } from '../../utils/response-handler'
import { prisma } from '../../utils/prisma'
import { generateAccessToken } from './login.auth'

export const refreshAccessToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!refreshToken) {
        throw new AuthenticationError('Refresh token tidak ditemukan');
    }

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
                    role: true,
                    username: true,
                    tenant_id: true,
                    profile: {
                        select: { id: true, full_name: true }
                    }
                }
            }
        }
    });

    if (!tokenRecord) {
        throw new AuthenticationError('Refresh token tidak valid atau expired');
    }

    const newAccessToken = generateAccessToken({
        id: tokenRecord.user.id,
        email: tokenRecord.user.email,
        role: tokenRecord.user.role,
        tenantId: tokenRecord.user.tenant_id
    });

    const decoded = jwt.verify(newAccessToken, process.env.JWT_SECRET_TOKEN as string) as any;
    const exp = decoded.exp;

    await prisma.detso_Refresh_Token.update({
        where: { id: tokenRecord.id },
        data: { updated_at: new Date() }
    });

    res.cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 15 * 60 * 1000,
    });

    const result = {
        accessToken: newAccessToken,
        expiresIn: '15m',
        user: {
            id: tokenRecord.user.id,
            email: tokenRecord.user.email,
            username: tokenRecord.user.username,
            role: tokenRecord.user.role,
            profile: tokenRecord.user.profile,
            tenantId: tokenRecord.user.tenant_id,
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
                tenant_id: true,
                profile: {
                    select: { id: true, full_name: true }
                }
            }
        });

        if (!user) {
            throw new AuthenticationError('User tidak ditemukan');
        }

        // Normalize tenant_id: convert null to undefined to satisfy expected type
        req.user = {
            ...user,
            tenant_id: user.tenant_id! ?? undefined
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
                        select: { id: true, full_name: true, avatar: true } // Tambahkan avatar jika perlu
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
            user = tokenRecord.user;
        }
    }

    if (!isValid || !user) {
        throw new AuthenticationError('Session tidak valid');
    }

    responseData(res, 200, 'Session valid', {
        isValid: true,
        user
    });
});