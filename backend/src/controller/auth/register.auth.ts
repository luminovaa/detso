import { Request, Response } from 'express'
import {  Detso_Role } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { registerSchema } from './validation/validation.auth'
import { asyncHandler, AuthenticationError } from '../../utils/error-handler'
import { responseData } from '../../utils/response-handler'
import { prisma } from '../../utils/prisma'


export const registerUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const validationResult = registerSchema.safeParse(req.body)
    
    if (!validationResult.success) {
      responseData(res, 400, 'Validasi Gagal', validationResult.error.format())
      return
    }

    const { email, password, username, role } = validationResult.data

    const existingUser = await prisma.detso_User.findFirst({
      where: {
        deleted_at: null,
        OR: [
          { email },
          { username }
        ]
      }
    })
    
    if (existingUser) {
      if (existingUser.email === email) {
        throw new AuthenticationError('Email sudah digunakan') 
      }
      if (existingUser.username === username) {
        throw new AuthenticationError('Username sudah digunakan')
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = await prisma.detso_User.create({
      data: {
        email,
        password: hashedPassword,
        username,
        role: role || Detso_Role.TEKNISI
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true
      }
    })

    const profile = await prisma.detso_Profile.create({
      data: {
        full_name: 'user',
        user_id: newUser.id
      },
      select: {
        id: true
      }
    })

    const result = {
      ...newUser,
      profile
    }

    responseData(res, 201, 'User berhasil terdaftar', result);
})