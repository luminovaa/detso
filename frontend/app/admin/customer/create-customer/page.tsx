"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AdminPanelLayout from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createCustomer } from "@/api/customer.api";
import { getPackages } from "@/api/package.api";
import { Loader2, X, FileText } from "lucide-react";
import {
  createCustomerSchema,
  DocumentData,
  PhotoData,
} from "@/types/customer.types";
import { FormField } from "@/components/admin/form-field";
import { useToast } from "@/hooks/use-toast";
import {
  FormErrorToast,
  useErrorToast,
} from "@/components/admin/toast-reusable";
import { Package } from "@/types/package.types";
import { FileDropzone } from "@/components/admin/dropzone-reusable";
import { Checkbox } from "@/components/ui/checkbox";

function CreateCustomer() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [packages, setPackages] = useState<Package[]>([]);
  const [document, setDocument] = useState<DocumentData>({ type: "ktp" }); // Single document instead of array
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1); // Extended steps
  const { success, warning } = useToast();
  const { showApiError, showValidationError } = useErrorToast();
  const [showFormErrors, setShowFormErrors] = useState(false);
  const [sameAsDomicile, setSameAsDomicile] = useState(false);

  const form = useForm({
    resolver: zodResolver(createCustomerSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      nik: "",
      package_id: "",
      address: "",
      address_service: "",
      lat: "",
      long: "",
      birth_date: undefined,
      birth_place: "",
      notes: "",
      documents: [],
      photos: [],
    },
  });

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const response = await getPackages();
        setPackages(response.data.data.packages);
      } catch (error) {
        console.error("Failed to fetch packages:", error);
      }
    };
    fetchPackages();
  }, []);

  const packageOptions = packages
    .filter((pkg) => typeof pkg.id === "string" && pkg.id !== undefined)
    .map((pkg) => ({
      value: pkg.id ?? "",
      label: `${pkg.name} - Rp ${pkg.price.toLocaleString("id-ID")}`,
    }));

  useEffect(() => {
    if (sameAsDomicile) {
      const domicileAddress = form.getValues("address");
      form.setValue("address_service", domicileAddress);
    }
  }, [form, sameAsDomicile]);

  // Photo types for each step
  const getPhotoTypesForStep = (currentStep: number) => {
    switch (currentStep) {
      case 3:
        return [{ value: "rumah_depan", label: "Foto Rumah Bagian Depan" }];
      case 4:
        return [
          { value: "rumah_samping", label: "Rumah Tampak Samping" },
          { value: "rumah_jauh", label: "Rumah Tampak Jauh" },
        ];
      case 5:
        return [
          { value: "denganpelanggan", label: "Foto dengan Pelanggan" },
          { value: "alat", label: "Foto Alat" },
        ];
      default:
        return [];
    }
  };

  // Update single document
  const updateDocument = (field: keyof DocumentData, value: any) => {
    setDocument(prev => ({ ...prev, [field]: value }));
  };

  const updatePhoto = (index: number, field: keyof PhotoData, value: any) => {
    const newPhotos = [...photos];
    newPhotos[index] = { ...newPhotos[index], [field]: value };
    setPhotos(newPhotos);
  };

  // Initialize photos for current step
  const initializePhotosForStep = (currentStep: number) => {
    const photoTypes = getPhotoTypesForStep(currentStep).map((t) => t.value);
    const existingTypes = photos.map((p) => p.type);

    const newPhotos: PhotoData[] = [];

    photoTypes.forEach((type) => {
      if (!existingTypes.includes(type)) {
        newPhotos.push({ type });
      }
    });

    if (newPhotos.length > 0) {
      setPhotos((prev) => [...prev, ...newPhotos]);
    }
  };

  useEffect(() => {
    if (step >= 3 && step <= 5) {
      initializePhotosForStep(step);
    }
  }, [step]);

  // Lanjut ke langkah berikutnya
  const nextStep = () => {
    setStep((prev) => (prev < 5 ? ((prev + 1) as 1 | 2 | 3 | 4 | 5) : 5));
    setShowFormErrors(false);
  };

  // Kembali ke langkah sebelumnya
  const prevStep = () => {
    setStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3 | 4 | 5) : 1));
    setShowFormErrors(false);
  };

  // Submit akhir
  const onSubmit = async () => {
    try {
      setIsLoading(true);
      const formData = new FormData();
      const data = form.getValues();

      // Tambahkan field dasar
      Object.entries(data).forEach(([key, value]) => {
        if (
          value !== undefined &&
          value !== null &&
          key !== "documents" &&
          key !== "photos"
        ) {
          if (key === "birth_date" && value instanceof Date) {
            formData.append(key, value.toISOString());
          } else {
            formData.append(key, String(value));
          }
        }
      });

      // Single document
      if (document.file) {
        formData.append(
          "documents",
          JSON.stringify([{ type: "ktp" }])
        );
        formData.append("documents", document.file);
      }

      // Foto
      const validPhotos = photos.filter((photo) => photo.type && photo.file);
      if (validPhotos.length > 0) {
        formData.append(
          "photos",
          JSON.stringify(validPhotos.map((photo) => ({ type: photo.type })))
        );
        validPhotos.forEach((photo) => {
          if (photo.file) formData.append("photos", photo.file);
        });
      }

      await createCustomer(formData);

      success(`Customer ${data.name} berhasil dibuat!`, {
        title: "Berhasil Membuat Customer",
      });

      setTimeout(() => {
        router.push("/admin/customer");
      }, 2000);
    } catch (err: any) {
      showApiError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return "Data Pribadi";
      case 2:
        return "Data Layanan";
      case 3:
        return "Upload Dokumen & Foto Rumah Depan";
      case 4:
        return "Foto Rumah Samping & Jauh";
      case 5:
        return "Foto dengan Pelanggan & Alat";
      default:
        return "";
    }
  };

  return (
    <AdminPanelLayout title="Tambah Customer Baru" showSearch={false}>
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{getStepTitle()}</CardTitle>
            <div className="flex mt-2 gap-1">
              {[1, 2, 3, 4, 5].map((stepNum) => (
                <div
                  key={stepNum}
                  className={`h-2 flex-1 rounded-full ${
                    step >= stepNum ? "bg-blue-500" : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                {/* Langkah 1: Data Pribadi */}
                {step === 1 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Data Pribadi</h3>

                    <div className="flex items-center gap-2 mb-4">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-semibold">Upload KTP</h3>
                        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          Kartu Tanda Penduduk
                        </span>
                      </div>
                      
                      <FileDropzone
                        onFileUpload={(file) => updateDocument("file", file)}
                        accept={{
                          "image/*": [".jpg", ".jpeg", ".png", ".gif"],
                          "application/pdf": [".pdf"],
                        }}
                        fileType="document"
                        label="Upload KTP *"
                        placeholder="Tarik & lepas file KTP (PDF/IMG, max 5MB)"
                        maxSizeMB={5}
                        disabled={isLoading}
                      />
                    <FormField
                      form={form}
                      name="name"
                      label="Nama Lengkap *"
                      placeholder="Masukkan nama lengkap"
                      disabled={isLoading}
                    />
                    <FormField
                      form={form}
                      name="nik"
                      label="NIK *"
                      placeholder="Masukkan NIK"
                      disabled={isLoading}
                    />
                    <FormField
                      form={form}
                      name="phone"
                      label="Nomor Telepon"
                      placeholder="Masukkan nomor telepon"
                      disabled={isLoading}
                    />
                    <FormField
                      form={form}
                      name="email"
                      label="Email"
                      type="email"
                      placeholder="Masukkan email"
                      disabled={isLoading}
                    />
                    <FormField
                      form={form}
                      name="birth_place"
                      label="Tempat Lahir"
                      placeholder="Masukkan tempat lahir"
                      disabled={isLoading}
                    />
                    <FormField
                      form={form}
                      name="birth_date"
                      label="Tanggal Lahir"
                      type="date"
                      disabled={isLoading}
                    />
                    <FormField
                      form={form}
                      name="address"
                      label="Alamat Domisili *"
                      type="textarea"
                      placeholder="Masukkan alamat lengkap"
                      disabled={isLoading}
                    />
                  </div>
                )}

                {/* Langkah 2: Data Layanan */}
                {step === 2 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Data Layanan</h3>
                    <FormField
                      form={form}
                      name="package_id"
                      label="Paket Layanan *"
                      type="select"
                      placeholder="Pilih paket layanan"
                      selectOptions={packageOptions}
                      disabled={isLoading}
                    />
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="same-address"
                        checked={sameAsDomicile}
                        onCheckedChange={(checked) =>
                          setSameAsDomicile(!!checked)
                        }
                      />
                      <label
                        htmlFor="same-address"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Alamat instalasi sama dengan alamat domisili
                      </label>
                    </div>

                    {!sameAsDomicile && (
                      <FormField
                        form={form}
                        name="address_service"
                        label="Alamat Instalasi *"
                        type="textarea"
                        placeholder="Masukkan alamat instalasi"
                        disabled={isLoading}
                      />
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        form={form}
                        name="lat"
                        label="Latitude"
                        placeholder="-7.123456"
                        disabled={isLoading}
                      />
                      <FormField
                        form={form}
                        name="long"
                        label="Longitude"
                        placeholder="112.123456"
                        disabled={isLoading}
                      />
                    </div>
                    <FormField
                      form={form}
                      name="notes"
                      label="Catatan"
                      type="textarea"
                      placeholder="Catatan tambahan..."
                      disabled={isLoading}
                    />
                  </div>
                )}

                {step === 3 && (
                  <> 
                    
                    {/* Foto Rumah Depan */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Foto Rumah Depan</h3>
                      {photos
                        .filter((p) => p.type === "rumah_depan")
                        .map((photo, idx) => {
                          const index = photos.findIndex(
                            (p) => p.type === "rumah_depan"
                          );
                          return (
                            <FileDropzone
                              key={`photo-${index}`}
                              onFileUpload={(file) =>
                                updatePhoto(index, "file", file)
                              }
                              fileType="image"
                              label="Foto Rumah Bagian Depan *"
                              placeholder="Tarik & lepas foto rumah depan"
                              accept={{
                                "image/*": [".jpg", ".jpeg", ".png", ".gif"],
                              }}
                              disabled={isLoading}
                            />
                          );
                        })}
                    </div>
                  </>
                )}

                {/* Langkah 4: Foto Rumah Samping & Jauh */}
                {step === 4 && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold">
                      Foto Rumah Tambahan
                    </h3>
                    {getPhotoTypesForStep(4).map(({ value, label }) => {
                      const photo = photos.find((p) => p.type === value);
                      const index = photos.findIndex((p) => p.type === value);

                      if (!photo) return null;

                      return (
                        <FileDropzone
                          key={value}
                          onFileUpload={(file) =>
                            updatePhoto(index, "file", file)
                          }
                          fileType="image"
                          label={`${label} *`}
                          accept={{
                            "image/*": [".jpg", ".jpeg", ".png", ".gif"],
                          }}
                          disabled={isLoading}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Langkah 5: Foto dengan Pelanggan & Alat */}
                {step === 5 && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold">
                      Foto Pelanggan & Alat
                    </h3>
                    {getPhotoTypesForStep(5).map(({ value, label }) => {
                      const photo = photos.find((p) => p.type === value);
                      const index = photos.findIndex((p) => p.type === value);

                      if (!photo) return null;

                      return (
                        <FileDropzone
                          key={value}
                          onFileUpload={(file) =>
                            updatePhoto(index, "file", file)
                          }
                          fileType="image"
                          label={`${label} *`}
                          accept={{
                            "image/*": [".jpg", ".jpeg", ".png", ".gif"],
                          }}
                          disabled={isLoading}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Tombol Navigasi */}
                <div className="flex justify-end gap-4 pt-6 border-t">
                  {step > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={prevStep}
                      disabled={isLoading}
                      className="rounded-3xl"
                    >
                      Sebelumnya
                    </Button>
                  )}

                  {step < 5 ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      disabled={isLoading}
                      className="rounded-3xl"
                    >
                      Selanjutnya
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={onSubmit}
                      disabled={isLoading}
                      className="rounded-3xl"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Menyimpan...
                        </>
                      ) : (
                        "Simpan Customer"
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </Form>

            {/* Toast Error */}
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

export default CreateCustomer;