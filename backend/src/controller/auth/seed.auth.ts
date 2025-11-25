import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Detso_Role } from '@prisma/client';
import { asyncHandler, AuthenticationError, ValidationError } from '../../utils/error-handler';
import { responseData } from '../../utils/response-handler';
import { prisma } from '../../utils/prisma';
import { z } from 'zod';

// Validasi input sederhana
const seedAdminSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3),
  password: z.string().min(6),
  full_name: z.string().optional(),
});

export const createSuperAdminSeed = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // 1. Cek Secret Token dari Header
  const setupToken = req.headers['x-setup-token'];
  
  if (setupToken !== process.env.ADMIN_SETUP_TOKEN) {
    throw new AuthenticationError('Token setup salah atau tidak ditemukan.');
  }

  // 2. Validasi Input
  const validationResult = seedAdminSchema.safeParse(req.body);
  if (!validationResult.success) {
    throw new ValidationError('Validasi gagal', validationResult.error.errors);
  }

  const { email, username, password, full_name } = validationResult.data;

  // 3. Cek apakah user sudah ada
  const existingUser = await prisma.detso_User.findFirst({
    where: {
      OR: [{ email }, { username }],
      deleted_at: null
    }
  });

  if (existingUser) {
    throw new ValidationError('User dengan email/username ini sudah ada.');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // 4. Create SAAS_SUPER_ADMIN
  // Perhatikan: tenant_id kita biarkan NULL atau undefined
  const result = await prisma.$transaction(async (tx) => {
    const newUser = await tx.detso_User.create({
      data: {
        email,
        username,
        password: hashedPassword,
        role: Detso_Role.SAAS_SUPER_ADMIN, // <--- ROLE SPESIAL
        tenant_id: null, // <--- PENTING: Super Admin tidak terikat tenant
        phone: null,
      }
    });

    const profile = await tx.detso_Profile.create({
      data: {
        full_name: full_name || 'Super Admin',
        user_id: newUser.id
      }
    });

    return { ...newUser, profile };
  });

  responseData(res, 201, 'SAAS Super Admin berhasil dibuat', {
    id: result.id,
    username: result.username,
    role: result.role,
    email: result.email
  });
});