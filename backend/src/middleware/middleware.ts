import { NextFunction, Request, Response } from "express";
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { responseData } from "../utils/response-handler";

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
    } else if (req.cookies?.token) {
      // Fallback ke cookie jika tidak ada di header
      token = req.cookies.token;
    }

    if (!token) {
      responseData(res, 401, 'Access token tidak ditemukan (dari header maupun cookie)');
      return;
    }

    if (!process.env.JWT_SECRET_TOKEN) {
      responseData(res, 500, 'JWT_SECRET is not defined in environment variables');
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_TOKEN) as {
      id: string;
      email: string;
      role: string;
    };

    if (!decoded?.id) {
      responseData(res, 401, 'Token tidak valid (ID tidak ditemukan)');
      return;
    }

    const user = await prisma.detso_User.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        deleted_at: null,
      }
    });

    if (!user || user.isDeleted) {
      responseData(res, 401, 'User tidak valid atau sudah dihapus');
      return;
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
        responseData(res, 401, 'Autentikasi dibutuhkan');
        return;
      }

      if (!allowedRoles.includes(req.user.role)) {
        responseData(res, 403, 'Anda tidak memiliki akses ke resource ini');
        return; 
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};


export { authMiddleware as default, requireRole };