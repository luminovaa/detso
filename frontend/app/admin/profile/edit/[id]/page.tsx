"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AdminPanelLayout from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserById, editUser } from "@/api/user.api";
import { Loader2, Upload, X, User as UserIcon } from "lucide-react";
import { UpdateUserFormData, updateUserSchema, User } from "@/types/user.types";
import { FormField } from "@/components/admin/form-field";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FormErrorToast,
  useErrorToast,
} from "@/components/admin/toast-reusable";
import Loading from "./loading";
import { authService } from "@/api/auth.api";
import { getInitials } from "@/utils/get-initial";

const roleOptions = [
  { value: "TEKNISI", label: "Teknisi" },
  { value: "ADMIN", label: "Admin" },
  { value: "SUPER_ADMIN", label: "Super Admin" },
];

function EditUser() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { success, warning } = useToast();
  const { showApiError, showValidationError } = useErrorToast();
  const [showFormErrors, setShowFormErrors] = useState(false);

  const form = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      email: "",
      username: "",
      phone: "",
      role: "TEKNISI",
      full_name: "",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingUser(true);
        setError(null);

        const authMe = await authService.getCurrentUser();
        setCurrentUser(authMe);

        if (!userId) {
          throw new Error("User ID tidak ditemukan");
        }

        const userData = await getUserById(userId);

        if (userData?.data?.data) {
          const user = userData.data.data;
          setUserProfile(user);

          form.reset({
            email: user.email || "",
            username: user.username || "",
            phone: user.phone || "",
            role: user.role || "TEKNISI",
            full_name: user.profile?.full_name || "",
          });

          if (user.profile?.avatar) {
            setPreviewUrl(user.profile.avatar);
          }
        } else {
          throw new Error("Data pengguna tidak ditemukan");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        setError(
          error instanceof Error ? error.message : "Failed to fetch user data"
        );
      } finally {
        setIsLoadingUser(false);
      }
    };

    fetchData();
  }, [userId, form]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        warning("File harus berupa gambar", {
          title: "Format File Tidak Valid",
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        warning("Ukuran file tidak boleh lebih dari 5MB", {
          title: "File Terlalu Besar",
        });
        return;
      }

      setSelectedFile(file);

      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(userProfile?.profile?.avatar || null);

    const fileInput = document.getElementById(
      "avatar-upload"
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const onSubmit = async (data: UpdateUserFormData) => {
    try {
      setIsLoading(true);

      const isEditingSelf = currentUser?.id === userId;
      const isRoleChanging = data.role !== userProfile?.role;

      if (
        isEditingSelf &&
        isRoleChanging &&
        currentUser?.role !== "SUPER_ADMIN"
      ) {
        warning("Anda tidak dapat mengubah role Anda sendiri", {
          title: "Akses Ditolak",
        });
        return;
      }

      const formData = new FormData();

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      if (selectedFile) {
        formData.append("avatar", selectedFile);
      }

      await editUser(formData, userId);

      success(`Data pengguna berhasil diperbarui!`, {
        title: "Berhasil Memperbarui Pengguna",
      });

      setTimeout(() => {
        router.push("/admin/profile");
      }, 2000);
    } catch (err: any) {
      showApiError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/admin/profile");
  };

  const handleFormError = () => {
    const errors = form.formState.errors;
    if (Object.keys(errors).length > 0) {
      showValidationError(errors, "Form Tidak Valid");
      setShowFormErrors(true);
    }
  };

  const canEditRole =
    currentUser?.role === "SUPER_ADMIN" && currentUser?.id !== userId;

  if (isLoadingUser) {
    return <Loading />;
  }

  if (error || !userProfile) {
    return (
      <AdminPanelLayout showSearch={false} title="Edit Pengguna">
        <div className="container mx-auto p-6 max-w-4xl">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-red-500 mb-4">
                <UserIcon className="w-12 h-12 mx-auto mb-2" />
                <p className="text-lg font-semibold">Error Loading User Data</p>
                <p className="text-sm text-gray-600">{error}</p>
              </div>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => window.location.reload()}>
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/admin/profile")}
                >
                  Kembali
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminPanelLayout>
    );
  }

  return (
    <AdminPanelLayout title="Edit Pengguna" showSearch={false}>
      <div className="max-w-4xl mx-auto">
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
          {/* Avatar Section */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Foto Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="w-32 h-32">
                  <AvatarImage
                    src={previewUrl || undefined}
                    alt={userProfile.profile?.full_name || userProfile.username}
                  />
                  <AvatarFallback className="text-2xl font-semibold bg-blue-100 text-blue-700">
                    {getInitials(
                      userProfile.profile?.full_name || userProfile.username
                    )}
                  </AvatarFallback>
                </Avatar>

                <div className="w-full space-y-2">
                  <Label
                    htmlFor="avatar-upload"
                    className="text-sm font-medium"
                  >
                    Upload Foto Baru
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      disabled={isLoading}
                      className="file:mr-2 file:rounded-md rounded-3xl file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>

                  {(selectedFile || previewUrl) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removeFile}
                      disabled={isLoading}
                      className="w-full rounded-3xl"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Hapus Foto
                    </Button>
                  )}

                  <p className="text-xs text-gray-500">
                    Format: JPG, PNG, GIF. Maksimal 5MB.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Informasi Pengguna</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit, handleFormError)}
                  className="space-y-6"
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      form={form}
                      name="full_name"
                      label="Nama Lengkap"
                      placeholder="Masukkan nama lengkap"
                      disabled={isLoading}
                    />

                    <FormField
                      form={form}
                      name="username"
                      label="Username"
                      placeholder="Masukkan username"
                      disabled={isLoading}
                    />
                  </div>

                  <FormField
                    form={form}
                    name="email"
                    type="email"
                    label="Email"
                    placeholder="Masukkan email"
                    disabled={isLoading}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      form={form}
                      name="phone"
                      label="Nomor Telepon"
                      placeholder="Masukkan nomor telepon"
                      disabled={isLoading}
                    />

                    <FormField
                      form={form}
                      name="role"
                      type="select"
                      label="Role"
                      placeholder="Pilih role"
                      disabled={isLoading || !canEditRole}
                      selectOptions={roleOptions}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-4 pt-6 border-t">
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
      </div>
    </AdminPanelLayout>
  );
}

export default EditUser;
