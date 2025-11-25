"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AdminPanelLayout from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// [UPDATED] Import kedua fungsi API
import { createUser, createUserTenant } from "@/api/user.api"; 
import { Loader2 } from "lucide-react";
// [UPDATED] Import kedua schema
import { 
  createUserSchema, 
  createUserTenantSchema, 
} from "@/types/user.types";
import { FormField } from "@/components/admin/form-field";
import { useToast } from "@/hooks/use-toast";
import {
  FormErrorToast,
  useErrorToast,
} from "@/components/admin/toast-reusable";
import CreateUserSkeleton from "./loading";
import { useAuth } from "@/components/admin/context/auth-provider";

// Opsi Role untuk Internal Tenant (Karyawan)
const employeeRoleOptions = [
  { value: "TENANT_TEKNISI", label: "Teknisi" },
  { value: "TENANT_ADMIN", label: "Admin Kantor" },
];

function CreateUser() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { success, warning } = useToast();
  const { showApiError, showValidationError } = useErrorToast();
  const [showFormErrors, setShowFormErrors] = useState(false);
  
  // [UPDATED] Ambil info user login
  const { user, isSuperAdmin } = useAuth(); 

  // [UPDATED] Tentukan Schema berdasarkan Role yang login
  // Jika Super Admin -> Pakai schema Tenant (wajib company_name)
  // Jika Tenant Staff -> Pakai schema User biasa
  const formSchema = isSuperAdmin ? createUserTenantSchema : createUserSchema;

  const form = useForm<any>({ // Gunakan any atau Union Type sementara karena dinamis
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      username: "",
      password: "",
      phone: "",
      full_name: "",
      // Jika Super Admin, default role user baru adalah OWNER
      // Jika Tenant Staff, default role user baru adalah TEKNISI
      role: isSuperAdmin ? "TENANT_OWNER" : "TENANT_TEKNISI",
      company_name: "", // Field ini hanya terpakai jika isSuperAdmin
    },
  });

  const onSubmit = async (data: any) => {
    try {
      setIsLoading(true);

      if (isSuperAdmin) {
        // [LOGIC SUPER ADMIN] -> Register Tenant Baru
        // Data otomatis cast ke CreateUserTenantFormData
        await createUserTenant(data);
        
        success(`Tenant "${data.company_name}" dan Owner berhasil dibuat!`, {
          title: "Registrasi Tenant Berhasil",
        });
      } else {
        // [LOGIC TENANT OWNER/ADMIN] -> Tambah Karyawan
        // Data otomatis cast ke CreateUserFormData
        await createUser(data);

        success(`Karyawan ${data.full_name} berhasil ditambahkan!`, {
          title: "Tambah User Berhasil",
        });
      }

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
      showValidationError(errors, "Form Tidak Valid");
      setShowFormErrors(true);
    }
  };

  if (isLoading) {
    return <CreateUserSkeleton />;
  }
  
  return (
    <AdminPanelLayout 
      title={isSuperAdmin ? "Registrasi Tenant Baru" : "Tambah Karyawan Baru"} 
      showSearch={false}
    >
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>
              {isSuperAdmin ? "Form Registrasi ISP" : "Form Data Karyawan"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit, handleFormError)}
                className="space-y-6"
              >
                {/* [NEW] Field Company Name (Hanya muncul untuk Super Admin) */}
                {isSuperAdmin && (
                  <FormField
                    form={form}
                    name="company_name"
                    label="Nama Perusahaan ISP (Tenant) *"
                    placeholder="Contoh: Berkah Net Fiber"
                    disabled={isLoading}
                  />
                )}

                <FormField
                  form={form}
                  name="full_name"
                  label={isSuperAdmin ? "Nama Pemilik (Owner) *" : "Nama Lengkap *"}
                  placeholder="Masukkan nama lengkap"
                  disabled={isLoading}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    form={form}
                    name="email"
                    type="email"
                    label="Email *"
                    placeholder="email@example.com"
                    disabled={isLoading}
                  />
                  <FormField
                    form={form}
                    name="phone"
                    label="Nomor Telepon *"
                    placeholder="0812..."
                    disabled={isLoading}
                  />
                </div>

                <FormField
                  form={form}
                  name="username"
                  label="Username *"
                  placeholder="Masukkan username login"
                  disabled={isLoading}
                />

                {/* [LOGIC ROLE SELECT] */}
                {/* Jika Super Admin: Role disembunyikan (otomatis OWNER) */}
                {/* Jika Tenant Staff: Role bisa dipilih (Admin/Teknisi) */}
                {!isSuperAdmin && (
                  <FormField
                    form={form}
                    name="role"
                    type="select"
                    label="Jabatan / Role *"
                    placeholder="Pilih jabatan"
                    disabled={isLoading}
                    selectOptions={employeeRoleOptions}
                  />
                )}

                <FormField
                  form={form}
                  name="password"
                  type="password"
                  label="Password *"
                  placeholder="Password akun"
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
                    {isLoading ? "Memproses..." : (isSuperAdmin ? "Buat Tenant" : "Simpan User")}
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