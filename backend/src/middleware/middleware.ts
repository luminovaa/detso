import { NextFunction, Request, Response } from "express";
import { prisma } from "../utils/prisma"; 
import jwt from 'jsonwebtoken';
import { AuthenticationError, AuthorizationError, DatabaseError } from "../utils/error-handler";
import { Detso_Role } from "@prisma/client"; // Import Enum Role

declare module 'express-serve-static-core' {
  
  interface Request {
    user?: {
      id: string;
      email: string;
      username: string;
      role: Detso_Role;
      phone: string | null;
      tenant_id: string | null;
      profile: {
        id: string;
        full_name: string;
        avatar: string | null;
      } | null;
    };
  }
}

const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw new AuthenticationError('Access token tidak ditemukan');
    }

    if (!process.env.JWT_SECRET_TOKEN) {
      throw new DatabaseError('JWT_SECRET is not defined');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_TOKEN) as {
      id: string;
      email: string;
      role: string;
    };

    if (!decoded?.id) {
      throw new AuthenticationError('Token tidak valid');
    }

    // [UPDATED] Fetch User + Tenant ID
    const user = await prisma.detso_User.findUnique({
      where: {
        id: decoded.id,
        deleted_at: null,
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
      throw new AuthenticationError('User tidak valid atau sudah dihapus');
    }

    // [UPDATED] Attach tenant_id to req.user
    req.user = {
      ...user,
      tenant_id: user.tenant_id
    };

    next();
  } catch (error) {
    next(error);
  }
};

// [UPDATED] Require Role dengan Support Array String / Enum
const requireRole = (allowedRoles: (string | Detso_Role)[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Autentikasi dibutuhkan');
      }

      // Cek apakah role user ada di dalam daftar allowedRoles
      if (!allowedRoles.includes(req.user.role)) {
        throw new AuthorizationError('Anda tidak memiliki akses ke resource ini');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Definisi grup role biar kode lebih rapi
const ALL_STAFF = [
  Detso_Role.TENANT_OWNER, 
  Detso_Role.TENANT_ADMIN, 
  Detso_Role.TENANT_TEKNISI
];

const ADMIN_ONLY = [
  Detso_Role.TENANT_OWNER, 
  Detso_Role.TENANT_ADMIN,
  Detso_Role.SAAS_SUPER_ADMIN
];

export { authMiddleware as default, requireRole, ALL_STAFF, ADMIN_ONLY };