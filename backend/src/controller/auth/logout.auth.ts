import { Request, Response } from 'express'
import { asyncHandler, AuthenticationError, ValidationError } from '../../utils/error-handler'
import { responseData } from '../../utils/response-handler'
import { loginSchema, refreshTokenSchema } from './validation/validation.auth'
import { prisma } from '../../utils/prisma'

export const logoutUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    const logoutAll = req.body.logoutAll || false; // Logout dari semua device

    if (refreshToken) {
        if (logoutAll) {
            // Logout dari semua device
            const tokenRecord = await prisma.detso_Refresh_Token.findFirst({
                where: { token: refreshToken },
                select: { user_id: true }
            })

            if (tokenRecord) {
                await prisma.detso_Refresh_Token.updateMany({
                    where: { 
                        user_id: tokenRecord.user_id,
                        is_active: true 
                    },
                    data: { 
                        is_active: false,
                        revoked_at: new Date()
                    }
                })
            }
        } else {
            // Logout dari device ini saja
            await prisma.detso_Refresh_Token.updateMany({
                where: { token: refreshToken },
                data: { 
                    is_active: false,
                    revoked_at: new Date()
                }
            })
        }
    }

    // Clear cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    responseData(res, 200, 'Logout berhasil', null)
})

export const revokeSession = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { sessionId } = req.params;
    const userId = req.user?.id;

    await prisma.detso_Refresh_Token.updateMany({
        where: {
            id: sessionId,
            user_id: userId,
            is_active: true
        },
        data: {
            is_active: false,
            revoked_at: new Date()
        }
    })

    responseData(res, 200, 'Sesi berhasil dicabut', null)
})