import { NextFunction, Request, Response } from "express";
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { AuthenticationError, AuthorizationError, DatabaseError } from "../utils/error-handler";

// Inisialisasi Prisma
const prisma = new PrismaClient();

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      email: string;
      role: string;
    };
  }
}

const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    // Prioritaskan Authorization header
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      // Fallback ke cookie jika tidak ada di header
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw new AuthenticationError( 'Access token tidak ditemukan (dari header maupun cookie)');
    }

    if (!process.env.JWT_SECRET_TOKEN) {
      throw new DatabaseError('JWT_SECRET is not defined in environment variables');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_TOKEN) as {
      id: string;
      email: string;
      role: string;
    };

    if (!decoded?.id) {
      throw new AuthenticationError('Token tidak valid (ID tidak ditemukan)');
    }

    const user = await prisma.detso_User.findUnique({
      where: {
        id: decoded.id,
        deleted_at: null,
      },
      select: {
        id: true,
        email: true,
        role: true,
      }
    });

    if (!user) {
      throw new AuthenticationError('User tidak valid atau sudah dihapus');
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};

const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Autentikasi dibutuhkan');
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw new AuthorizationError('Anda tidak memiliki akses ke resource ini');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};


export { authMiddleware as default, requireRole };