"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter as useNextRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AdminPanelLayout from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FormErrorToast, useErrorToast } from "@/components/admin/toast-reusable";
import { FormField } from "@/components/admin/form-field";
import { getUserById, editUser } from "@/api/user.api"; 
import { User, updateUserSchema, UpdateUserFormData } from "@/types/user.types";
import EditUserSkeleton from "./loading";
import { useAuth } from "@/components/admin/context/auth-provider"; // Import Auth

// [UPDATED] Definisi Opsi Role yang Benar
const ALL_ROLES = [
  { value: "TENANT_TEKNISI", label: "Teknisi" },
  { value: "TENANT_ADMIN", label: "Admin" },
  { value: "TENANT_OWNER", label: "Owner" },
];

function EditUser() {
  const router = useNextRouter();
  const params = useParams();
  const userId = params.id as string; 
  
  // [NEW] Ambil info user login untuk logic role options
  const { user: currentUser, isSuperAdmin } = useAuth(); 

  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState(false);
  const { success } = useToast();
  const { showApiError, showValidationError } = useErrorToast();

  // [NEW] Filter Role Options berdasarkan Hak Akses
  const availableRoleOptions = useMemo(() => {
    if (isSuperAdmin) return ALL_ROLES; // Super Admin boleh jadikan apa aja
    if (currentUser?.role === 'TENANT_OWNER') return ALL_ROLES; // Owner boleh angkat Owner lain (opsional) atau Admin
    
    // Admin HANYA boleh pilih Admin atau Teknisi (Gak boleh Owner)
    return ALL_ROLES.filter(r => r.value !== 'TENANT_OWNER');
  }, [isSuperAdmin, currentUser]);

  const form = useForm<UpdateUserFormData>({ // Tambahkan generic type
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      email: "",
      username: "",
      phone: "",
      role: undefined, // Biarkan undefined dulu
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
          phone: userData.phone || "",
          // Pastikan role dari backend match dengan value di options
          role: userData.role as any, 
          full_name: userData.profile?.full_name || "",
        });
      } catch (err) {
        showApiError(err);
        // Jika user tidak ketemu/akses ditolak, kembalikan ke list
        router.push("/admin/user");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [userId]); // Tambahkan dependency userId

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
        // Gunakan dialog UI library kalau bisa, tapi window.confirm oke untuk cepat
        if (window.confirm("Data yang sudah diisi akan hilang jika dibatalkan.")) {
            router.push("/admin/user");
        }
    } else {
      router.push("/admin/user");
    }
  };

  if (isLoading) {
    return <EditUserSkeleton/>;
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
              <form onSubmit={form.handleSubmit(onSubmit, () => setFormErrors(true))} className="space-y-6">
                
                <FormField
                  form={form}
                  name="full_name"
                  label="Nama Lengkap *"
                  placeholder="Masukkan nama lengkap"
                  disabled={isLoading}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    name="phone"
                    label="Nomor Telepon *"
                    placeholder="Masukkan nomor telepon"
                    disabled={isLoading}
                    />
                </div>

                <FormField
                  form={form}
                  name="username"
                  label="Username *"
                  placeholder="Masukkan username"
                  disabled={isLoading}
                />

                <FormField
                  form={form}
                  name="role"
                  type="select"
                  label="Role / Jabatan *"
                  placeholder="Pilih role"
                  disabled={isLoading}
                  selectOptions={availableRoleOptions} // [UPDATED] Gunakan opsi dinamis
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
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
                  </Button>
                </div>
              </form>
            </Form>

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