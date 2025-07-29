import { Request, Response } from 'express'
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
                    profile: {
                        select: { id: true, full_name: true }
                    }
                }
            }
        }
    })

    if (!tokenRecord) {
        throw new AuthenticationError('Refresh token tidak valid atau expired');
    }

    const newAccessToken = generateAccessToken({
        id: tokenRecord.user.id,
        email: tokenRecord.user.email,
        role: tokenRecord.user.role
    })

    await prisma.detso_Refresh_Token.update({
        where: { id: tokenRecord.id },
        data: { updated_at: new Date() }
    })

    res.cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
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
            profile: tokenRecord.user.profile
        }
    }

    responseData(res, 200, 'Token berhasil diperbarui', result)
})
