import { z } from "zod";

export const paginationSchema = z.object({
  page: z
    .string()
    .default('1')
    .transform((val) => parseInt(val))
    .refine((val) => val > 0, { message: 'Halaman harus lebih besar dari 0' }),
  limit: z
    .string()
    .default('10')
    .transform((val) => parseInt(val))
    .refine((val) => val > 0, { message: 'Batas harus lebih besar dari 0' })
})
