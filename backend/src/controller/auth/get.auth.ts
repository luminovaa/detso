import { asyncHandler } from "../../utils/error-handler";
import { prisma } from "../../utils/prisma";
import { responseData } from "../../utils/response-handler";
import { log } from "../../config/logger.config";
import { Request, Response } from 'express'

export const getActiveSessions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const currentToken = req.cookies.refreshToken;

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
            token: true,
            device_info: true,
            ip_address: true,
            created_at: true,
            updated_at: true,
            expires_at: true,
        },
        orderBy: {
            updated_at: 'desc'
        }
    })

    const formattedSessions = sessions.map(session => ({
        id: session.id,
        device_info: session.device_info,
        ip_address: session.ip_address,
        created_at: session.created_at,
        updated_at: session.updated_at,
        expires_at: session.expires_at,
        is_current: session.token === currentToken,
    }));

    responseData(res, 200, 'Sesi aktif berhasil diambil', formattedSessions)
})

/**
 * Cleanup expired tokens dan revoked tokens yang sudah > 7 hari
 * Revoked tokens disimpan 7 hari untuk audit trail (reuse detection)
 */
export const cleanupExpiredTokens = async () => {
    try {
        const auditRetention = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

        const result = await prisma.detso_Refresh_Token.deleteMany({
            where: {
                OR: [
                    // Token yang sudah expired
                    { expires_at: { lt: new Date() } },
                    // Token revoked yang sudah lewat 7 hari (audit trail retention)
                    { 
                        is_active: false,
                        revoked_at: { lt: auditRetention }
                    }
                ]
            }
        })

        if (result.count > 0) {
            log.info('Token cleanup completed', { deletedCount: result.count });
        }

        return result.count;
    } catch (error) {
        log.error('Token cleanup failed', { error });
        return 0;
    }
}