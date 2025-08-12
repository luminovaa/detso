import { User } from "./user.types";
import z from "zod";
export type Profile = {
    id?: string;
    user_id: string;
    full_name: string;
    avatar: string;
    created_at?: Date;
    updated_at?: Date;
    user: User;
};

export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(6, "Password lama wajib diisi"),
    password: z.string().min(6, "Password baru minimal 6 karakter"),
    confirmPassword: z.string().min(6, "Konfirmasi password wajib diisi"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password baru dan konfirmasi tidak cocok",
    path: ["confirmPassword"],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;