import { Request, Response } from 'express'
import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { registerSchema } from './validation/validation.user'
import { asyncHandler } from '../../utils/error-handler'
import { responseData } from '../../utils/response-handler'

const prisma = new PrismaClient()

export const registerUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const validationResult = registerSchema.safeParse(req.body)
    
    if (!validationResult.success) {
      responseData(res, 400, 'Validasi Gagal', validationResult.error.format())
      return
    }

    const { email, password, username } = validationResult.data

    const existingUser = await prisma.user.findFirst({
      where: {
        isDeleted: false,
        OR: [
          { email },
          { username }
        ]
      }
    })
    
    if (existingUser) {
      if (existingUser.email === email) {
        responseData(res, 409, 'Email sudah digunakan')
        return 
      }
      if (existingUser.username === username) {
        responseData(res, 409, 'Username sudah digunakan')
        return 
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        username,
        role: Role.USER
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true
      }
    })

    const profile = await prisma.profile.create({
      data: {
        name: 'user',
        userId: newUser.id
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