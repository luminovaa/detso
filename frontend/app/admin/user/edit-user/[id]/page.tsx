"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter as useNextRouter } from "next/navigation";
import AdminPanelLayout from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FormErrorToast, useErrorToast } from "@/components/admin/toast-reusable";
import { FormField } from "@/components/admin/form-field";

import { role, updateUserSchema, UpdateUserFormData } from "@/types/user.types";
import { getUserById, editUser } from "@/api/user.api"; 
import { User } from "@/types/user.types";
import EditUserSkeleton from "./loading";
 
const roleOptions = [
  { value: "TEKNISI", label: "Teknisi" },
  { value: "ADMIN", label: "Admin" },
  { value: "SUPER_ADMIN", label: "Super Admin" },
];

function EditUser() {
  const router = useNextRouter();
    const params = useParams();
  const userId = params.id as string; 
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState(false);
  const { success, warning } = useToast();
  const { showApiError, showValidationError } = useErrorToast();

  const form = useForm({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      email: "",
      username: "",
      phone: "",
      role: role.TEKNISI,
      full_name: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (!userId) return;

    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const response = await getUserById(userId);
        const userData: User = response.data.data;

        form.reset({
          email: userData.email,
          username: userData.username,
          phone: userData.phone,
          role: userData.role,
          full_name: userData.profile?.full_name || "",
        });
      } catch (err) {
        showApiError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  const onSubmit = async (data: UpdateUserFormData) => {
    if (!userId) return;

    try {
      setIsLoading(true);

      await editUser(data, userId);

      success(`Pengguna ${data.full_name} berhasil diperbarui!`, {
        title: "Berhasil Memperbarui Pengguna",
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
      const confirm = window.confirm(
        "Data yang sudah diisi akan hilang jika dibatalkan."
      );
      if (confirm) {
        router.push("/admin/user");
      }
    } else {
      router.push("/admin/user");
    }
  };

  const handleFormError = () => {
    const errors = form.formState.errors;
    if (Object.keys(errors).length > 0) {
      showValidationError(errors, "Form Tidak Valid");
      setFormErrors(true);
    }
  };

  if (isLoading) {
    return (
      <EditUserSkeleton/>
    );
  }

  return (
    <AdminPanelLayout title="Edit Pengguna" showSearch={false}>
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Edit Pengguna</CardTitle>
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

            {/* Error Toast */}
            <FormErrorToast
              errors={form.formState.errors}
              isVisible={formErrors}
              onDismiss={() => setFormErrors(false)}
            />
          </CardContent>
        </Card>
      </div>
    </AdminPanelLayout>
  );
}

export default EditUser;