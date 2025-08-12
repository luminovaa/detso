/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AdminPanelLayout from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import {
  CreatePackageFormData,
  createPackageSchema,
} from "@/types/package.types";
import { FormField } from "@/components/admin/form-field";
import { useToast } from "@/hooks/use-toast";
import { getPackageById, updatePackage } from "@/api/package.api";
import {
  FormErrorToast,
  useErrorToast,
  withErrorToast,
} from "@/components/admin/toast-reusable";

function EditPackagePage() {
  const router = useRouter();
  const params = useParams();
  const packageId = params.id as string;
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
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

  useEffect(() => {
  const fetchPackageData = async () => {
    try {
      const packageData = await getPackageById(packageId);
      form.reset({
          name: packageData.data.data.name,
          speed: packageData.data.data.speed,
        price: packageData.data.data.price,
      });
    } catch (err: any) {
      showApiError(err);
      router.push("/admin/package");
    } finally {
      setIsFetching(false);
    }
  };

  fetchPackageData();
}, [packageId]);

  const onSubmit = async (data: CreatePackageFormData) => {
    try {
      setIsLoading(true);

      await updatePackage(packageId, data);

      success(`Paket ${data.name} berhasil diperbarui!`, {
        title: "Berhasil Memperbarui Paket",
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
      warning("Perubahan yang sudah dibuat akan hilang jika dibatalkan.", {
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

  if (isFetching) {
    return (
      <AdminPanelLayout title="Memuat Data Paket" showSearch={false}>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminPanelLayout>
    );
  }

  return (
    <AdminPanelLayout title="Edit Paket" showSearch={false}>
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Edit Paket</CardTitle>
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
                    {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
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

export default EditPackagePage;