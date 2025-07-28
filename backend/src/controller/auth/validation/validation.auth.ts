import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().min(3, 'Username/email harus minimal 3 karakter'),
  password: z.string().min(6, 'Kata sandi harus minimal 6 karakter')
})


export const refreshTokenSchema = z.object({
    refreshToken: z.string().optional()
})