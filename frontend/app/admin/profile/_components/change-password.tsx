// components/profile/change-password-dialog.tsx
"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { authService } from "@/api/auth.api";
import { useErrorToast } from "@/components/admin/toast-reusable";
import { FormField } from "@/components/admin/form-field";
import { ChangePasswordFormValues, changePasswordSchema } from "@/types/profile.types";


export function ChangePasswordDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { showApiError } = useErrorToast();

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    mode: "onSubmit",
    defaultValues: {
      oldPassword: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: ChangePasswordFormValues) {
    setLoading(true);
    try {

      const isValid = await form.trigger();
      if (!isValid) {
        setLoading(false);
        return;
      }
      await authService.changePassword(data.oldPassword, data.password, data.confirmPassword);
      
      // Success toast
      toast({
        title: "Berhasil!",
        description: "Password berhasil diubah.",
      });
      
      form.reset();
      setOpen(false);
    } catch (error: any) {
      // Gunakan error toast yang sudah dibuat
      showApiError(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Lock className="w-4 h-4 mr-2" />
          Ubah Password
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ubah Password</DialogTitle>
          <DialogDescription>
            Masukkan password lama dan password baru Anda.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              form={form}
              name="oldPassword"
              label="Password Lama"
              type="password"
              placeholder="••••••••"
              disabled={loading}
            />
            
            <FormField
              form={form}
              name="password"
              label="Password Baru"
              type="password"
              placeholder="••••••••"
              disabled={loading}
              description="Password baru minimal 6 karakter."
            />
            
            <FormField
              form={form}
              name="confirmPassword"
              label="Konfirmasi Password"
              type="password"
              placeholder="••••••••"
              disabled={loading}
              description="Pastikan password baru dan konfirmasi cocok."
            />
            
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}