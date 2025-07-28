import { asyncHandler } from "../../utils/error-handler";
import { prisma } from "../../utils/prisma";
import { responseData } from "../../utils/response-handler";
import { Request, Response } from 'express'

export const getActiveSessions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;

    const sessions = await prisma.detso_Refresh_Token.findMany({
        where: {
            user_id: userId,
            is_active: true,
            revoked_at: null,
            expires_at: {
                gt: new Date()
            }
        },
        select: {
            id: true,
            device_info: true,
            ip_address: true,
            created_at: true,
            updated_at: true
        },
        orderBy: {
            updated_at: 'desc'
        }
    })

    responseData(res, 200, 'Sesi aktif berhasil diambil', sessions)
})


export const cleanupExpiredTokens = async () => {
    await prisma.detso_Refresh_Token.deleteMany({
        where: {
            OR: [
                { expires_at: { lt: new Date() } },
                { revoked_at: { not: null } }
            ]
        }
    })
}