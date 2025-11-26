import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { asyncHandler, AuthenticationError, ValidationError } from '../../utils/error-handler'
import { responseData } from '../../utils/response-handler'
import { loginSchema, refreshTokenSchema } from './validation/validation.auth'
import { prisma } from '../../utils/prisma'

interface TokenPayload {
    id: string;
    email: string;
    role: string;
    tenantId: string | null; // null jika dia SAAS_SUPER_ADMIN
}

export const generateAccessToken = (payload: TokenPayload): string => {
    return jwt.sign(
        payload,
        process.env.JWT_SECRET_TOKEN as string,
        { expiresIn: '15m' } // Access token expire dalam 15 menit
    )
}

const generateRefreshToken = (): string => {
    return crypto.randomBytes(40).toString('hex')
}

const getDeviceInfo = (req: Request) => {
    const userAgent = req.headers['user-agent'] || ''
    const platform = req.headers['x-platform'] || 'web'
    const appVersion = req.headers['x-app-version'] || ''

    return {
        device_info: `${platform} ${appVersion}`.trim(),
        user_agent: userAgent,
        ip_address: req.ip || req.connection.remoteAddress
    }
}

export const loginUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const validationResult = loginSchema.safeParse(req.body);

    if (!validationResult.success) {
        throw new ValidationError('Validation error', validationResult.error.errors);
    }

    const { identifier, password } = validationResult.data;

    const user = await prisma.detso_User.findFirst({
        where: {
            deleted_at: null,
            OR: [
                { email: identifier },
                { username: identifier }
            ]
        },
        select: {
            id: true,
            email: true,
            username: true,
            password: true,
            role: true,
            tenant_id: true, // [UPDATED] Penting! Ambil tenant_id
            profile: {
                select: { id: true, full_name: true }
            }
        }
    })

    if (!user) {
        throw new AuthenticationError('Username/email atau password salah');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
        throw new AuthenticationError('Username/email atau password salah');
    }

    // [UPDATED] Masukkan tenantId ke payload
    const accessToken = generateAccessToken({
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenant_id
    })

    const refreshToken = generateRefreshToken()
    const deviceInfo = getDeviceInfo(req)

    await prisma.detso_Refresh_Token.create({
        data: {
            user_id: user.id,
            token: refreshToken,
            device_info: deviceInfo.device_info,
            user_agent: deviceInfo.user_agent,
            ip_address: deviceInfo.ip_address,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
    })

    // Set Cookies (Tetap sama)
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    const decoded = jwt.decode(accessToken) as { exp: number } | null;
    const exp = decoded?.exp || null;

    const result = {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        tenantId: user.tenant_id, // [UPDATED] Kembalikan info tenant ke client
        profile: user.profile,
        accessToken,
        refreshToken,
        expiresIn: '15m',
        exp: exp
    }

    responseData(res, 200, 'Login berhasil', result)
})