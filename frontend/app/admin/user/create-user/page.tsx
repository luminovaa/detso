"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AdminPanelLayout from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createUser } from "@/api/user.api";
import { Loader2 } from "lucide-react";
import { CreateUserFormData, createUserSchema, role } from "@/types/user.types";
import { FormField } from "@/components/admin/form-field";
import { useToast } from "@/hooks/use-toast";
import {
  FormErrorToast,
  useErrorToast,
  withErrorToast,
} from "@/components/admin/toast-reusable";

const roleOptions = [
  { value: "TEKNISI", label: "Teknisi" },
  { value: "ADMIN", label: "Admin" },
  { value: "SUPER_ADMIN", label: "Super Admin" },
];

function CreateUser() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { success, warning, info } = useToast();
  const { showApiError, showValidationError } = useErrorToast();
  const [showFormErrors, setShowFormErrors] = useState(false);

  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: "",
      username: "",
      password: "",
      phone: "",
      role: "TEKNISI",
      full_name: "",
    },
  });

  const onSubmit = async (data: CreateUserFormData) => {
    try {
      setIsLoading(true);

       await createUser(data);

      success(`Pengguna ${data.full_name} berhasil dibuat!`, {
        title: "Berhasil Membuat Pengguna",
      });

      setTimeout(() => {
        router.push("/admin/user");
      }, 2000);
    } catch (err: any) {
      showApiError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (form.formState.isDirty) {
      warning("Data yang sudah diisi akan hilang jika dibatalkan.", {
        title: "Konfirmasi Pembatalan",
      });
      return;
    }
    router.push("/admin/user");
  };

  const handleFormError = () => {
    const errors = form.formState.errors;
    if (Object.keys(errors).length > 0) {
      // Method 3: Menggunakan validation error helper
      showValidationError(errors, "Form Tidak Valid");
      setShowFormErrors(true);
    }
  };
  return (
    <AdminPanelLayout title="Tambah Pengguna Baru" showSearch={false}>
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Tambah Pengguna</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit, handleFormError)}
                className="space-y-6"
              >
                <FormField
                  form={form}
                  name="full_name"
                  label="Nama Lengkap *"
                  placeholder="Masukkan nama lengkap"
                  disabled={isLoading}
                />

                <FormField
                  form={form}
                  name="email"
                  type="email"
                  label="Email *"
                  placeholder="Masukkan email"
                  disabled={isLoading}
                />
                <FormField
                  form={form}
                  name="username"
                  label="Username *"
                  placeholder="Masukkan username"
                  disabled={isLoading}
                />

                <FormField
                  form={form}
                  name="phone"
                  label="Nomor Telepon *"
                  placeholder="Masukkan nomor telepon"
                  disabled={isLoading}
                />

                <FormField
                  form={form}
                  name="role"
                  type="select"
                  label="Role *"
                  placeholder="Pilih role"
                  disabled={isLoading}
                  selectOptions={roleOptions}
                />

                {/* Password */}
                <FormField
                  form={form}
                  name="password"
                  type="password"
                  label="Password *"
                  placeholder="Masukkan password"
                  disabled={isLoading}
                />

                {/* Action Buttons */}
                <div className="flex justify-end gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isLoading}
                    className="rounded-3xl"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="rounded-3xl"
                  >
                    {isLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isLoading ? "Menyimpan..." : "Simpan"}
                  </Button>
                </div>
              </form>
            </Form>
            <FormErrorToast
              errors={form.formState.errors}
              isVisible={showFormErrors}
              onDismiss={() => setShowFormErrors(false)}
            />
          </CardContent>
        </Card>
      </div>
    </AdminPanelLayout>
  );
}

export default CreateUser;
