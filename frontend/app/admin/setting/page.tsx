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
import { useToast } from "@/hooks/use-toast";
import { FormField } from "@/components/admin/form-field";
import { FileDropzone } from "@/components/admin/dropzone-reusable";
import {
  FormErrorToast,
  useErrorToast,
} from "@/components/admin/toast-reusable";
import { useAuth } from "@/components/admin/context/auth-provider"; // Untuk cek role super admin

// Types & API
import {
  editTenantSchema,
  EditTenantFormData,
  Tenant,
} from "@/types/tenant.types";
import { getTenantById, updateTenant } from "@/api/tenant.api";
import { ThemeSettingsCard } from "./_components/theme-settings";

function EditTenantPage() {
  const router = useRouter();
  const { user } = useAuth(); 

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [showFormErrors, setShowFormErrors] = useState(false);

  // State untuk menyimpan URL logo lama
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null);

  const { success, warning } = useToast();
  const { showApiError, showValidationError } = useErrorToast();

  const form = useForm<EditTenantFormData>({
    resolver: zodResolver(editTenantSchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
      is_active: undefined, // Default undefined
      logo: undefined,
    },
  });

  // Fetch Tenant Data
  useEffect(() => {
    const fetchTenantData = async () => {
      const tenantId = user?.tenantId;
      console.log(user)
      try {
        const response = await getTenantById(tenantId!);
        const tenant: Tenant = response.data.data;

        form.reset({
          name: tenant.name,
          address: tenant.address || "",
          phone: tenant.phone || "",
          // Convert boolean to string enum for Select/Form
          is_active: tenant.is_active ? "true" : "false",
        });

        // Simpan URL logo lama untuk preview
        if (tenant.logo) {
          setCurrentLogoUrl(tenant.logo);
        }
      } catch (err: any) {
        showApiError(err);
      } finally {
        setIsFetching(false);
      }
    };

    fetchTenantData();
  }, []);

  const onSubmit = async (data: EditTenantFormData) => {
    const tenantId = user?.tenantId;
    try {
      setIsLoading(true);

      // Kirim data ke API (termasuk file logo jika ada)
      await updateTenant(tenantId!, data);

      success(`Profil Tenant berhasil diperbarui!`, {
        title: "Update Berhasil",
      });

      // Redirect balik ke list (atau dashboard jika owner)
    } catch (err: any) {
      showApiError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoUpload = (file: File | null) => {
    form.setValue("logo", file, { shouldValidate: true, shouldDirty: true });
  };

  const handleCancel = () => {
    if (form.formState.isDirty) {
      if (confirm("Perubahan yang sudah dibuat akan hilang jika dibatalkan.")) {
        router.back();
      }
    } else {
      router.back();
    }
  };

  const handleFormError = () => {
    const errors = form.formState.errors;
    if (Object.keys(errors).length > 0) {
      showValidationError(errors, "Form Tidak Valid");
      setShowFormErrors(true);
    }
  };

  //   if (isFetching) {
  //     return <EditTenantSkeleton />;
  //   }

  return (
    <AdminPanelLayout title="Edit Profil Tenant" showSearch={false}>
      <div className="max-w-2xl mx-auto">
      <div className="lg:col-span-3 mb-2">
        <ThemeSettingsCard />
      </div>
        <Card>
          <CardHeader>
            <CardTitle>Perbarui Data Perusahaan</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit, handleFormError)}
                className="space-y-6"
              >
                {/* --- Section Logo --- */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Logo Perusahaan</label>

                  <FileDropzone
                    label={
                      currentLogoUrl ? "Ganti Logo (Opsional)" : "Upload Logo"
                    }
                    onFileUpload={handleLogoUpload}
                    accept={{ "image/*": [".png", ".jpg", ".jpeg"] }}
                    maxSizeMB={2}
                    initialPreviewUrl={currentLogoUrl}
                    minWidth={200} // Agar tidak pecah/blur di layar retina
                    minHeight={200}
                    maxWidth={1024} // Agar tidak terlalu besar (beban loading)
                    maxHeight={1024}
                    placeholder="Klik untuk ganti logo (Min 200x200px)"
                    disabled={isLoading}
                  />
                </div>

                {/* --- Section Form Data --- */}
                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    form={form}
                    name="name"
                    label="Nama Perusahaan *"
                    placeholder="Masukkan nama ISP"
                    disabled={isLoading}
                  />

                  <FormField
                    form={form}
                    name="phone"
                    label="Nomor Telepon Kantor"
                    placeholder="Contoh: 021-555xxx"
                    disabled={isLoading}
                  />

                  <FormField
                    form={form}
                    name="address"
                    type="textarea"
                    label="Alamat Lengkap"
                    placeholder="Alamat kantor pusat..."
                    disabled={isLoading}
                  />
                </div>

                {/* --- Actions --- */}
                <div className="flex justify-end gap-4 pt-4 border-t mt-6">
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
                    className="rounded-3xl bg-blue-600 hover:bg-blue-700"
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

export default EditTenantPage;
