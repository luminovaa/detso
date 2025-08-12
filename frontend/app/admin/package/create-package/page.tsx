"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AdminPanelLayout from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createPackage } from "@/api/package.api";
import { Loader2 } from "lucide-react";
import {
  CreatePackageFormData,
  createPackageSchema,
} from "@/types/package.types";
import { FormField } from "@/components/admin/form-field";
import { useToast } from "@/hooks/use-toast";
import {
  FormErrorToast,
  useErrorToast,
  withErrorToast,
} from "@/components/admin/toast-reusable";

function CreatePackage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { success, warning, info } = useToast();
  const { showApiError, showValidationError } = useErrorToast();
  const [showFormErrors, setShowFormErrors] = useState(false);

  const form = useForm({
    resolver: zodResolver(createPackageSchema),
    defaultValues: {
      name: "",
      speed: "",
      price: 0,
    },
  });

  const onSubmit = async (data: CreatePackageFormData) => {
    try {
      setIsLoading(true);

      await createPackage(data);

      success(`Paket ${data.name} berhasil dibuat!`, {
        title: "Berhasil Membuat Paket",
      });

      setTimeout(() => {
        router.push("/admin/package");
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
    router.push("/admin/package");
  };

  const handleFormError = () => {
    const errors = form.formState.errors;
    if (Object.keys(errors).length > 0) {
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
                  name="name"
                  label="Nama Paket *"
                  placeholder="Masukkan nama paket"
                  disabled={isLoading}
                />

                <FormField
                  form={form}
                  name="speed"
                  label="Kecepatan *"
                  placeholder="Masukkan kecepatan"
                  disabled={isLoading}
                />

                <FormField
                  form={form}
                  name="price"
                  label="Harga *"
                  type="currency"
                  placeholder="Masukkan harga"
                  disabled={isLoading}
                />

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

export default CreatePackage;
